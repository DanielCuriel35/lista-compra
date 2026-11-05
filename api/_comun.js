// Utilidades compartidas por las funciones de /api (Vercel no publica
// como ruta los archivos que empiezan por "_").

const USUARIOS = ["Daniel", "Diego", "Macu", "Marina"];

const SUPERMERCADOS = {
    lidl: "Lidl",
    mercadona: "Mercadona",
    otros: "Otros"
};

function config() {
    const faltan = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "VAPID_PUBLIC_KEY",
        "VAPID_PRIVATE_KEY"
    ].filter(n => !process.env[n]);

    if (faltan.length)
        throw new Error(`Faltan variables de entorno en Vercel: ${faltan.join(", ")}`);

    return {
        supabaseUrl: process.env.SUPABASE_URL.replace(/\/$/, ""),
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        vapidPublic: process.env.VAPID_PUBLIC_KEY,
        vapidPrivate: process.env.VAPID_PRIVATE_KEY,
        vapidSubject: process.env.VAPID_SUBJECT || "mailto:avisos@lista-compra.app"
    };
}

// Llamada a la API REST de Supabase con la clave de servicio
// (solo existe en el servidor, nunca llega al navegador).
async function supabase(cfg, ruta, opciones = {}) {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/${ruta}`, {
        ...opciones,
        headers: {
            apikey: cfg.serviceKey,
            Authorization: `Bearer ${cfg.serviceKey}`,
            "Content-Type": "application/json",
            ...(opciones.headers || {})
        }
    });

    if (!res.ok)
        throw new Error(`Supabase ${res.status}: ${await res.text()}`);

    const texto = await res.text();
    return texto ? JSON.parse(texto) : null;
}

function leerCuerpo(req) {
    if (req.body && typeof req.body === "object") return req.body;
    try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
}

module.exports = { USUARIOS, SUPERMERCADOS, config, supabase, leerCuerpo };
