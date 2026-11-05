// POST /api/avisar  { usuario, supermercado }
// Manda "X está en el <súper>" a todos los móviles suscritos
// menos a los de quien envía el aviso.

const webpush = require("web-push");
const { USUARIOS, SUPERMERCADOS, config, supabase, leerCuerpo } = require("./_comun");

function listaBonita(nombres) {
    if (nombres.length === 1) return nombres[0];
    return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido" });
    }

    let cfg;
    try {
        cfg = config();
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }

    const { usuario, supermercado } = leerCuerpo(req);

    if (!USUARIOS.includes(usuario))
        return res.status(400).json({ error: "Usuario no válido" });

    if (!SUPERMERCADOS[supermercado])
        return res.status(400).json({ error: "Supermercado no válido" });

    const nombreSuper = SUPERMERCADOS[supermercado];

    try {
        // Lo que falta de ese súper, para que el aviso sea útil
        const pendientes = await supabase(cfg,
            "productos?select=nombre,supermercado&comprado=eq.false&order=created_at.asc");

        const deEseSuper = (pendientes || [])
            .filter(p => (SUPERMERCADOS[p.supermercado] ? p.supermercado : "otros") === supermercado)
            .map(p => p.nombre);

        let cuerpo;
        if (!deEseSuper.length) {
            cuerpo = "¿Necesitas algo? Apúntalo en la lista.";
        } else {
            const primeros = deEseSuper.slice(0, 3);
            const resto = deEseSuper.length - primeros.length;
            cuerpo = `En la lista: ${resto ? `${primeros.join(", ")} y ${resto} más` : listaBonita(primeros)}. ¿Falta algo?`;
        }

        const destinos = await supabase(cfg,
            `suscripciones?select=endpoint,suscripcion&usuario=neq.${encodeURIComponent(usuario)}`);

        webpush.setVapidDetails(cfg.vapidSubject, cfg.vapidPublic, cfg.vapidPrivate);

        const mensaje = JSON.stringify({
            title: supermercado === "otros"
                ? `${usuario} está comprando`
                : `${usuario} está en el ${nombreSuper}`,
            body: cuerpo,
            tag: `estoy-en-${usuario}`,
            url: "/"
        });

        let enviados = 0;
        const caducados = [];

        await Promise.all((destinos || []).map(async d => {
            try {
                await webpush.sendNotification(d.suscripcion, mensaje, { TTL: 60 * 60, urgency: "high" });
                enviados++;
            } catch (e) {
                // 404/410: el móvil ya no acepta avisos (permiso quitado, app borrada...)
                if (e.statusCode === 404 || e.statusCode === 410) caducados.push(d.endpoint);
                else console.error("Error enviando aviso", e.statusCode, e.body);
            }
        }));

        await Promise.all(caducados.map(endpoint =>
            supabase(cfg, `suscripciones?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE" })
                .catch(e => console.error(e))));

        return res.status(200).json({ ok: true, enviados });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "No se pudo enviar el aviso" });
    }
};
