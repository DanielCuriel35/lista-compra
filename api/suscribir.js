// GET  /api/suscribir -> devuelve la clave pública para suscribirse
// POST /api/suscribir -> guarda (o actualiza) la suscripción de este móvil
//      { usuario, suscripcion }
// DELETE /api/suscribir -> borra la suscripción { endpoint }

const { USUARIOS, config, supabase, leerCuerpo } = require("./_comun");

module.exports = async (req, res) => {
    let cfg;
    try {
        cfg = config();
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }

    if (req.method === "GET")
        return res.status(200).json({ publicKey: cfg.vapidPublic });

    const cuerpo = leerCuerpo(req);

    try {
        if (req.method === "POST") {
            const { usuario, suscripcion } = cuerpo;

            if (!USUARIOS.includes(usuario))
                return res.status(400).json({ error: "Usuario no válido" });

            if (!suscripcion || typeof suscripcion.endpoint !== "string" || !suscripcion.keys)
                return res.status(400).json({ error: "Suscripción no válida" });

            await supabase(cfg, "suscripciones?on_conflict=endpoint", {
                method: "POST",
                headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
                body: JSON.stringify({
                    endpoint: suscripcion.endpoint,
                    usuario,
                    suscripcion,
                    updated_at: new Date().toISOString()
                })
            });

            return res.status(200).json({ ok: true });
        }

        if (req.method === "DELETE") {
            if (typeof cuerpo.endpoint !== "string")
                return res.status(400).json({ error: "Falta endpoint" });

            await supabase(cfg, `suscripciones?endpoint=eq.${encodeURIComponent(cuerpo.endpoint)}`, {
                method: "DELETE"
            });

            return res.status(200).json({ ok: true });
        }

        res.setHeader("Allow", "GET, POST, DELETE");
        return res.status(405).json({ error: "Método no permitido" });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "No se pudo guardar la suscripción" });
    }
};
