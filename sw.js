// Service worker: recibe los avisos aunque la web esté cerrada.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
    let datos = {};
    try { datos = event.data ? event.data.json() : {}; } catch (e) { }

    event.waitUntil(self.registration.showNotification(datos.title || "Lista de la compra", {
        body: datos.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: datos.tag,
        renotify: !!datos.tag,
        data: { url: datos.url || "/" }
    }));
});

// Al tocar el aviso se abre la lista (o se trae al frente si ya está abierta)
self.addEventListener("notificationclick", event => {
    event.notification.close();
    const url = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil((async () => {
        const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const v of ventanas) {
            if (v.url.startsWith(self.location.origin)) {
                await v.focus();
                return;
            }
        }
        await self.clients.openWindow(url);
    })());
});
