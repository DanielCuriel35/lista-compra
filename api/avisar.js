// POST /api/avisar
//
//   { tipo: "estoy", usuario, supermercado }
//       "X está en el <súper>" a todos los móviles menos a los de X.
//       Además apunta que X está comprando en ese súper (tabla estoy_en).
//
//   { tipo: "anadido", usuario, nombre, supermercado }
//       Alguien ha apuntado un producto: se avisa a quien haya dicho
//       "estoy en <ese súper>" en los últimos MINUTOS_COMPRANDO minutos.
//
//   { tipo: "fin", usuario }
//       X ha pulsado "Compra hecha": deja de constar como comprando.
//
// Si no se indica tipo, se entiende "estoy" (compatibilidad).

const webpush = require("web-push");
const { USUARIOS, SUPERMERCADOS, config, supabase, leerCuerpo } = require("./_comun");

const MINUTOS_COMPRANDO = 30;

function listaBonita(nombres) {
    if (nombres.length === 1) return nombres[0];
    return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

function superDe(p) {
    return SUPERMERCADOS[p.supermercado] ? p.supermercado : "otros";
}

// Manda el mensaje a las suscripciones indicadas y limpia las caducadas
async function enviar(cfg, destinos, mensaje) {
    webpush.setVapidDetails(cfg.vapidSubject, cfg.vapidPublic, cfg.vapidPrivate);

    let enviados = 0;
    const caducados = [];

    await Promise.all((destinos || []).map(async d => {
        try {
            await webpush.sendNotification(d.suscripcion, JSON.stringify(mensaje), { TTL: 60 * 60, urgency: "high" });
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

    return enviados;
}

async function avisoEstoy(cfg, usuario, supermercado) {
    const nombreSuper = SUPERMERCADOS[supermercado];

    // Apuntamos que está comprando, para avisarle de lo que se añada.
    // Si falla (p. ej. falta la tabla), el aviso principal se manda igual.
    await supabase(cfg, "estoy_en?on_conflict=usuario", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ usuario, supermercado, desde: new Date().toISOString() })
    }).catch(e => console.error("No se pudo guardar estoy_en", e));

    // Lo que falta de ese súper, para que el aviso sea útil
    const pendientes = await supabase(cfg,
        "productos?select=nombre,supermercado&comprado=eq.false&order=created_at.asc");

    const deEseSuper = (pendientes || [])
        .filter(p => superDe(p) === supermercado)
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

    return enviar(cfg, destinos, {
        title: supermercado === "otros"
            ? `${usuario} está comprando`
            : `${usuario} está en el ${nombreSuper}`,
        body: cuerpo,
        tag: `estoy-en-${usuario}`,
        url: "/"
    });
}

async function avisoAnadido(cfg, usuario, nombre, supermercado) {
    const desde = new Date(Date.now() - MINUTOS_COMPRANDO * 60 * 1000).toISOString();

    const comprando = await supabase(cfg,
        `estoy_en?select=usuario&supermercado=eq.${supermercado}` +
        `&desde=gte.${encodeURIComponent(desde)}&usuario=neq.${encodeURIComponent(usuario)}`);

    const quienes = (comprando || []).map(c => c.usuario).filter(u => USUARIOS.includes(u));
    if (!quienes.length) return 0;

    const destinos = await supabase(cfg,
        `suscripciones?select=endpoint,suscripcion&usuario=in.(${quienes.map(encodeURIComponent).join(",")})`);

    return enviar(cfg, destinos, {
        title: `${usuario} ha añadido ${nombre}`,
        body: supermercado === "otros"
            ? "Lo acaba de apuntar en la lista mientras estás comprando."
            : `Es del ${SUPERMERCADOS[supermercado]} y lo acaba de apuntar mientras estás allí.`,
        tag: `anadido-${Date.now()}`,
        url: "/"
    });
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

    const { tipo = "estoy", usuario, supermercado, nombre } = leerCuerpo(req);

    if (!USUARIOS.includes(usuario))
        return res.status(400).json({ error: "Usuario no válido" });

    try {
        if (tipo === "fin") {
            await supabase(cfg, `estoy_en?usuario=eq.${encodeURIComponent(usuario)}`, { method: "DELETE" });
            return res.status(200).json({ ok: true });
        }

        if (!SUPERMERCADOS[supermercado])
            return res.status(400).json({ error: "Supermercado no válido" });

        if (tipo === "estoy") {
            const enviados = await avisoEstoy(cfg, usuario, supermercado);
            return res.status(200).json({ ok: true, enviados });
        }

        if (tipo === "anadido") {
            const limpio = String(nombre || "").trim().slice(0, 80);
            if (!limpio) return res.status(400).json({ error: "Falta el producto" });

            const enviados = await avisoAnadido(cfg, usuario, limpio, supermercado);
            return res.status(200).json({ ok: true, enviados });
        }

        return res.status(400).json({ error: "Tipo de aviso no válido" });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "No se pudo enviar el aviso" });
    }
};
