const txt = document.getElementById("txtProduct");
const composer = document.getElementById("composer");
const listPending = document.getElementById("listPending");
const listDone = document.getElementById("listDone");
const emptyPending = document.getElementById("emptyPending");
const doneSection = document.getElementById("doneSection");
const pending = document.getElementById("pending");
const done = document.getElementById("done");
const summary = document.getElementById("summary");
const progressBar = document.getElementById("progressBar");

/* ---------- Supermercados ---------- */

const SUPERMERCADOS = {
    lidl: { nombre: "Lidl", color: "#0050AA" },
    mercadona: { nombre: "Mercadona", color: "#00804A" },
    otros: { nombre: "Otros", color: "#8A8079" }
};

const selSuper = document.getElementById("selSuper");

Object.entries(SUPERMERCADOS).forEach(([id, s]) => {
    selSuper.add(new Option(s.nombre, id));
});

try {
    const superGuardado = localStorage.getItem("supermercado");
    if (SUPERMERCADOS[superGuardado]) selSuper.value = superGuardado;
} catch (e) { }

function pintarSelect() {
    selSuper.parentElement.style.setProperty("--c", SUPERMERCADOS[selSuper.value].color);
}

selSuper.addEventListener("change", () => {
    pintarSelect();
    try { localStorage.setItem("supermercado", selSuper.value); } catch (e) { }
    txt.focus();
});

pintarSelect();

function etiquetaSuper(id) {
    const s = SUPERMERCADOS[id];
    if (!s) return "";
    return `<span class="super-tag" style="--c:${s.color}">${s.nombre}</span>`;
}

/* ---------- Filtro por supermercado ---------- */

const filters = document.getElementById("filters");
const emptyText = document.getElementById("emptyText");

let filtro = "todos";
let ultimosDatos = [];

try {
    const filtroGuardado = localStorage.getItem("filtro");
    if (SUPERMERCADOS[filtroGuardado]) filtro = filtroGuardado;
} catch (e) { }

// Los productos antiguos sin supermercado cuentan como "Otros"
function superDe(prod) {
    return SUPERMERCADOS[prod.supermercado] ? prod.supermercado : "otros";
}

// Pinta las pastillas Todos / Lidl / Mercadona / Otros en un contenedor
function crearFiltros(contenedor, activo, contar, alElegir) {
    const opciones = [["todos", { nombre: "Todos", color: "var(--accent)" }], ...Object.entries(SUPERMERCADOS)];

    contenedor.replaceChildren(...opciones.map(([id, s]) => {
        const b = document.createElement("button");
        b.className = "filter" + (activo === id ? " active" : "");
        b.style.setProperty("--c", s.color);
        b.setAttribute("aria-pressed", activo === id);
        const n = contar(id);
        b.innerHTML = `${s.nombre}${n ? `<span class="filter-count">${n}</span>` : ""}`;
        b.addEventListener("click", () => alElegir(id));
        return b;
    }));
}

function pintarFiltros() {
    crearFiltros(filters, filtro,
        id => ultimosDatos.filter(p => !p.comprado && (id === "todos" || superDe(p) === id)).length,
        elegirFiltro);
}

function elegirFiltro(id) {
    filtro = id;
    try { localStorage.setItem("filtro", id); } catch (e) { }

    // Si filtras por un súper, lo nuevo que añadas va a ese súper
    if (id !== "todos") {
        selSuper.value = id;
        pintarSelect();
        try { localStorage.setItem("supermercado", id); } catch (e) { }
    }

    pintar(ultimosDatos);
}

/* ---------- Usuarios ---------- */

const USUARIOS = {
    Daniel: "#EE7A1A", // naranja
    Diego: "#D63A2F",  // rojo
    Macu: "#7E3FB0",   // morado
    Marina: "#E2508A"  // rosa
};

const login = document.getElementById("login");
const userButtons = document.getElementById("userButtons");
const btnChangeUser = document.getElementById("btnChangeUser");
const chipAvatar = document.getElementById("chipAvatar");
const chipName = document.getElementById("chipName");

let usuario = null;

try {
    const guardado = localStorage.getItem("usuario");
    if (guardado && USUARIOS[guardado]) usuario = guardado;
} catch (e) { }

function escapar(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
}

function colorDe(nombre) {
    return USUARIOS[nombre] || "#9C9087";
}

function etiquetaUsuario(nombre) {
    if (!nombre) return "";
    return `<span class="user-tag" style="--c:${colorDe(nombre)}">${escapar(nombre)}</span>`;
}

function mostrarLogin() {
    userButtons.querySelectorAll(".user-card").forEach(b =>
        b.classList.toggle("active", b.dataset.nombre === usuario));
    login.classList.remove("hidden");
}

function elegirUsuario(nombre) {
    usuario = nombre;
    try { localStorage.setItem("usuario", nombre); } catch (e) { }
    login.classList.add("hidden");
    chipAvatar.textContent = nombre[0];
    chipAvatar.style.setProperty("--c", colorDe(nombre));
    chipName.textContent = nombre;
    sincronizarSuscripcion();
}

Object.keys(USUARIOS).forEach(nombre => {
    const b = document.createElement("button");
    b.className = "user-card";
    b.dataset.nombre = nombre;
    b.style.setProperty("--c", colorDe(nombre));
    b.innerHTML = `<span class="avatar" style="--c:${colorDe(nombre)}">${nombre[0]}</span>${nombre}`;
    b.addEventListener("click", () => elegirUsuario(nombre));
    userButtons.appendChild(b);
});

btnChangeUser.addEventListener("click", mostrarLogin);

if (usuario) elegirUsuario(usuario);
else mostrarLogin();

/* ---------- Confirmación ---------- */

const confirmBox = document.getElementById("confirm");
const confirmText = document.getElementById("confirmText");
const confirmYes = document.getElementById("confirmYes");

function confirmar(texto, { si = "Eliminar", clase = "btn-danger" } = {}) {
    return new Promise(resolve => {
        confirmText.innerHTML = texto;
        confirmYes.textContent = si;
        confirmYes.className = `btn ${clase}`;
        confirmBox.classList.remove("hidden");

        const cerrar = valor => {
            confirmBox.classList.add("hidden");
            confirmBox.onclick = null;
            document.onkeydown = null;
            resolve(valor);
        };

        confirmYes.onclick = () => cerrar(true);
        document.getElementById("confirmNo").onclick = () => cerrar(false);
        confirmBox.onclick = e => { if (e.target === confirmBox) cerrar(false); };
        document.onkeydown = e => { if (e.key === "Escape") cerrar(false); };
    });
}

/* ---------- Lista ---------- */

const ICONO_BORRAR = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>`;

async function cargar() {
    const { data, error } = await client
        .from("productos")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    pintar(data || []);
}

function crearFila(prod) {
    const row = document.createElement("li");
    row.className = "item";

    row.innerHTML = `
        <input type="checkbox" class="check" ${prod.comprado ? "checked" : ""}
               aria-label="Marcar ${escapar(prod.nombre)}">
        <span class="name">${escapar(prod.nombre)}${etiquetaSuper(prod.supermercado)}</span>
        ${etiquetaUsuario(prod.usuario)}
        <button class="delete" aria-label="Eliminar ${escapar(prod.nombre)}">${ICONO_BORRAR}</button>
    `;

    const check = row.querySelector(".check");

    check.addEventListener("change", () => marcar(prod.id, check.checked));

    // Tocar el nombre también marca/desmarca
    row.querySelector(".name").addEventListener("click", () => {
        check.checked = !check.checked;
        marcar(prod.id, check.checked);
    });

    row.querySelector(".delete").addEventListener("click", async () => {
        if (await confirmar(`¿Quitar <strong>${escapar(prod.nombre)}</strong> de la lista?`)) {
            await borrar(prod.id);
        }
    });

    return row;
}

function pintar(todos) {
    ultimosDatos = todos;
    pintarFiltros();

    const datos = filtro === "todos" ? todos : todos.filter(p => superDe(p) === filtro);

    emptyText.textContent = filtro === "todos"
        ? "No falta nada. Apunta lo primero que se acabe."
        : `No falta nada del ${SUPERMERCADOS[filtro].nombre}.`;

    const pendientes = datos.filter(p => !p.comprado);
    const comprados = datos.filter(p => p.comprado);

    listPending.replaceChildren(...pendientes.map(crearFila));
    listDone.replaceChildren(...comprados.map(crearFila));

    pending.textContent = pendientes.length;
    done.textContent = comprados.length;

    emptyPending.classList.toggle("hidden", pendientes.length > 0);
    doneSection.classList.toggle("hidden", comprados.length === 0);

    const total = datos.length;
    progressBar.style.width = total ? `${(comprados.length / total) * 100}%` : "0";

    btnCompraHecha.classList.toggle("hidden", todos.length === 0);

    if (pestana !== "lista")
        return;

    if (!total)
        summary.textContent = "Lista vacía";
    else if (!pendientes.length)
        summary.textContent = "¡Todo comprado! 🎉";
    else
        summary.textContent = `${pendientes.length} por comprar · ${comprados.length} en el carro`;
}

async function insertar() {

    const nombre = txt.value.trim();

    if (!nombre) return;

    if (!usuario) {
        mostrarLogin();
        return;
    }

    txt.value = "";

    const { error } = await client
        .from("productos")
        .insert({
            nombre: nombre,
            comprado: false,
            usuario: usuario,
            supermercado: selSuper.value
        });

    if (error) {
        console.error(error);
        alert(error.message);
        txt.value = nombre;
        return;
    }

    await cargar();
}

async function marcar(id, valor) {

    const { error } = await client
        .from("productos")
        .update({
            comprado: valor
        })
        .eq("id", id);

    if (error) {
        console.error(error);
        alert(error.message);
    }

    await cargar();
}

async function borrar(id) {

    const { error } = await client
        .from("productos")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    await cargar();
}

composer.addEventListener("submit", e => {
    e.preventDefault();
    insertar();
});

/* ---------- Pestañas ---------- */

const viewLista = document.getElementById("viewLista");
const viewRegistros = document.getElementById("viewRegistros");
const tabs = document.querySelectorAll(".tab");

let pestana = "lista";

function cambiarPestana(nombre) {
    pestana = nombre;

    tabs.forEach(t => {
        const activa = t.dataset.tab === nombre;
        t.classList.toggle("active", activa);
        t.setAttribute("aria-selected", activa);
    });

    viewLista.classList.toggle("hidden", nombre !== "lista");
    viewRegistros.classList.toggle("hidden", nombre !== "registros");

    if (nombre === "lista") {
        pintar(ultimosDatos);
    } else {
        cerrarDetalle();
        cargarRegistros();
    }

    window.scrollTo(0, 0);
}

tabs.forEach(t => t.addEventListener("click", () => cambiarPestana(t.dataset.tab)));

/* ---------- Aviso breve ---------- */

const toast = document.getElementById("toast");
let toastTimer;

function avisar(texto) {
    toast.textContent = texto;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 2600);
}

/* ---------- Compra hecha ---------- */

const btnCompraHecha = document.getElementById("btnCompraHecha");

async function compraHecha() {

    if (!usuario) {
        mostrarLogin();
        return;
    }

    // Leemos la lista actual de la base de datos para no perder nada
    const { data: productos, error: errorLeer } = await client
        .from("productos")
        .select("*")
        .order("created_at", { ascending: true });

    if (errorLeer) {
        console.error(errorLeer);
        alert(errorLeer.message);
        return;
    }

    if (!productos.length) return;

    const sinMarcar = productos.filter(p => !p.comprado).length;
    const plural = n => n === 1 ? "producto" : "productos";

    let texto = `¿Compra hecha? Se guardarán <strong>${productos.length} ${plural(productos.length)}</strong> en Registros y la lista quedará vacía.`;
    if (sinMarcar)
        texto += `<br><span class="sheet-note">${sinMarcar === 1
            ? "1 producto sin marcar se guardará como no comprado."
            : `${sinMarcar} productos sin marcar se guardarán como no comprados.`}</span>`;

    if (!await confirmar(texto, { si: "Compra hecha", clase: "btn-primary" }))
        return;

    const { error: errorGuardar } = await client
        .from("registros")
        .insert({
            usuario: usuario,
            productos: productos.map(p => ({
                nombre: p.nombre,
                supermercado: p.supermercado || null,
                usuario: p.usuario || null,
                comprado: !!p.comprado
            }))
        });

    if (errorGuardar) {
        console.error(errorGuardar);
        alert(errorGuardar.message);
        return;
    }

    // Solo borramos lo que se ha guardado (por si alguien añade algo justo ahora)
    const { error: errorBorrar } = await client
        .from("productos")
        .delete()
        .in("id", productos.map(p => p.id));

    if (errorBorrar) {
        console.error(errorBorrar);
        alert(errorBorrar.message);
    }

    await cargar();
    avisar("Compra guardada en Registros");
}

btnCompraHecha.addEventListener("click", compraHecha);

/* ---------- Registros ---------- */

const registrosUl = document.getElementById("registros");
const registrosVacio = document.getElementById("registrosVacio");
const registrosLista = document.getElementById("registrosLista");
const registroDetalle = document.getElementById("registroDetalle");
const detalleFecha = document.getElementById("detalleFecha");
const detalleInfo = document.getElementById("detalleInfo");
const regFilters = document.getElementById("regFilters");
const regItems = document.getElementById("regItems");
const regVacio = document.getElementById("regVacio");
const regVacioText = document.getElementById("regVacioText");

let registros = [];
let registroAbierto = null;
let filtroRegistro = "todos";

const fmtDia = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
const fmtDiaAnio = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtHora = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });

function fechaBonita(iso) {
    const d = new Date(iso);
    const fmt = d.getFullYear() === new Date().getFullYear() ? fmtDia : fmtDiaAnio;
    const dia = fmt.format(d);
    return { dia: dia[0].toUpperCase() + dia.slice(1), hora: fmtHora.format(d) };
}

async function cargarRegistros() {
    const { data, error } = await client
        .from("registros")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    registros = data || [];

    if (registroAbierto) {
        registroAbierto = registros.find(r => r.id === registroAbierto.id) || null;
        if (registroAbierto) pintarDetalle();
        else cerrarDetalle();
    }

    pintarRegistros();
}

function pintarRegistros() {
    if (pestana === "registros" && !registroAbierto) {
        summary.textContent = registros.length === 1
            ? "1 compra guardada"
            : `${registros.length} compras guardadas`;
    }

    registrosVacio.classList.toggle("hidden", registros.length > 0);

    registrosUl.replaceChildren(...registros.map(reg => {
        const productos = reg.productos || [];
        const { dia, hora } = fechaBonita(reg.created_at);

        const porSuper = Object.keys(SUPERMERCADOS)
            .map(id => [id, productos.filter(p => superDe(p) === id).length])
            .filter(([, n]) => n > 0)
            .map(([id, n]) => `<span class="super-tag" style="--c:${SUPERMERCADOS[id].color}">${SUPERMERCADOS[id].nombre} ${n}</span>`)
            .join("");

        const li = document.createElement("li");
        li.innerHTML = `
            <button class="registro">
                <span class="registro-main">
                    <span class="registro-fecha">${dia}</span>
                    <span class="registro-meta">
                        ${hora} · ${productos.length} ${productos.length === 1 ? "producto" : "productos"}
                        ${reg.usuario ? `· ${etiquetaUsuario(reg.usuario)}` : ""}
                    </span>
                    <span class="registro-supers">${porSuper}</span>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        `;
        li.querySelector("button").addEventListener("click", () => abrirDetalle(reg));
        return li;
    }));
}

function abrirDetalle(reg) {
    registroAbierto = reg;
    filtroRegistro = "todos";
    registrosLista.classList.add("hidden");
    registroDetalle.classList.remove("hidden");
    pintarDetalle();
    window.scrollTo(0, 0);
}

function cerrarDetalle() {
    registroAbierto = null;
    registroDetalle.classList.add("hidden");
    registrosLista.classList.remove("hidden");
    pintarRegistros();
}

document.getElementById("btnVolver").addEventListener("click", cerrarDetalle);

function pintarDetalle() {
    const reg = registroAbierto;
    const productos = reg.productos || [];
    const { dia, hora } = fechaBonita(reg.created_at);

    detalleFecha.textContent = `${dia}, ${hora}`;
    detalleInfo.innerHTML = reg.usuario ? `Compra hecha por ${etiquetaUsuario(reg.usuario)}` : "";

    const comprados = productos.filter(p => p.comprado).length;
    summary.textContent = comprados === productos.length
        ? `${productos.length} ${productos.length === 1 ? "producto" : "productos"}`
        : `${comprados} de ${productos.length} comprados`;

    crearFiltros(regFilters, filtroRegistro,
        id => productos.filter(p => id === "todos" || superDe(p) === id).length,
        id => { filtroRegistro = id; pintarDetalle(); });

    const visibles = productos
        .filter(p => filtroRegistro === "todos" || superDe(p) === filtroRegistro)
        // primero lo comprado, después lo que se quedó sin comprar
        .sort((a, b) => (b.comprado === true) - (a.comprado === true));

    regItems.replaceChildren(...visibles.map(p => {
        const li = document.createElement("li");
        li.className = "item reg-item" + (p.comprado ? "" : " no-comprado");
        li.innerHTML = `
            <span class="reg-icon">${p.comprado
                ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Comprado"><path d="M20 6 9 17l-5-5"/></svg>`
                : ""}</span>
            <span class="name">${escapar(p.nombre)}${etiquetaSuper(p.supermercado)}${p.comprado ? "" : `<span class="no-comprado-tag">No comprado</span>`}</span>
            ${etiquetaUsuario(p.usuario)}
        `;
        return li;
    }));

    regVacio.classList.toggle("hidden", visibles.length > 0);
    regVacioText.textContent = filtroRegistro === "todos"
        ? "Esta compra no tiene productos."
        : `En esta compra no hubo nada del ${SUPERMERCADOS[filtroRegistro].nombre}.`;
}

/*
    Si activas Realtime en Supabase,
    la lista se actualizará automáticamente
    cuando cualquier dispositivo haga cambios.
*/
client
    .channel("productos")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "productos"
        },
        () => cargar()
    )
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "registros"
        },
        () => { if (pestana === "registros") cargarRegistros(); }
    )
    .subscribe();

/* ---------- Avisos "Estoy en..." ---------- */

const selEstoy = document.getElementById("selEstoy");
const btnAvisar = document.getElementById("btnAvisar");
const avisosEstado = document.getElementById("avisosEstado");

const PUSH_SOPORTADO = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const ES_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const ES_APP = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

var swReg = null; // "var": puede consultarse antes de llegar a esta línea

Object.entries(SUPERMERCADOS).forEach(([id, s]) => selEstoy.add(new Option(s.nombre, id)));

try {
    const estoyGuardado = localStorage.getItem("estoyEn");
    if (SUPERMERCADOS[estoyGuardado]) selEstoy.value = estoyGuardado;
} catch (e) { }

function pintarEstoy() {
    selEstoy.parentElement.style.setProperty("--c", SUPERMERCADOS[selEstoy.value].color);
}

selEstoy.addEventListener("change", () => {
    pintarEstoy();
    try { localStorage.setItem("estoyEn", selEstoy.value); } catch (e) { }
});

pintarEstoy();

function base64AUint8(base64) {
    const relleno = "=".repeat((4 - base64.length % 4) % 4);
    const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(crudo, c => c.charCodeAt(0));
}

async function api(ruta, opciones = {}) {
    const res = await fetch(ruta, {
        ...opciones,
        headers: { "Content-Type": "application/json", ...(opciones.headers || {}) }
    });
    let datos = {};
    try { datos = await res.json(); } catch (e) { }
    if (!res.ok) throw new Error(datos.error || `Error ${res.status}`);
    return datos;
}

async function suscripcionActual() {
    return swReg ? swReg.pushManager.getSubscription() : null;
}

// Guarda en el servidor que este móvil es de "usuario"
async function sincronizarSuscripcion() {
    try {
        const sub = await suscripcionActual();
        if (!sub || !usuario) return;
        await api("/api/suscribir", {
            method: "POST",
            body: JSON.stringify({ usuario, suscripcion: sub.toJSON() })
        });
    } catch (e) {
        console.error(e);
    }
}

async function pintarEstadoAvisos() {
    let html = "";

    if (!PUSH_SOPORTADO) {
        html = ES_IOS && !ES_APP
            ? "Para recibir avisos en iPhone, añade la web a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y ábrela desde ahí."
            : "Este navegador no puede recibir avisos.";
    } else if (Notification.permission === "denied") {
        html = "Los avisos están bloqueados en este navegador. Actívalos en los ajustes del sitio para recibirlos.";
    } else if (!await suscripcionActual()) {
        html = `<button id="btnActivarAvisos" class="link-activar">Activa los avisos en este móvil</button> para enterarte cuando alguien esté en el súper.`;
    }

    avisosEstado.innerHTML = html;
    avisosEstado.classList.toggle("hidden", !html);

    const btn = document.getElementById("btnActivarAvisos");
    if (btn) btn.addEventListener("click", activarAvisos);
}

async function activarAvisos() {
    if (!usuario) {
        mostrarLogin();
        return;
    }

    try {
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") {
            await pintarEstadoAvisos();
            return;
        }

        const { publicKey } = await api("/api/suscribir");

        const sub = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64AUint8(publicKey)
        });

        await api("/api/suscribir", {
            method: "POST",
            body: JSON.stringify({ usuario, suscripcion: sub.toJSON() })
        });

        avisar("Avisos activados en este móvil");
    } catch (e) {
        console.error(e);
        alert(`No se pudieron activar los avisos: ${e.message}`);
    }

    await pintarEstadoAvisos();
}

async function enviarEstoyEn() {
    if (!usuario) {
        mostrarLogin();
        return;
    }

    const supermercado = selEstoy.value;
    btnAvisar.disabled = true;

    try {
        const { enviados } = await api("/api/avisar", {
            method: "POST",
            body: JSON.stringify({ usuario, supermercado })
        });

        avisar(enviados
            ? `Aviso enviado a ${enviados} ${enviados === 1 ? "móvil" : "móviles"}`
            : "Nadie más tiene los avisos activados todavía");

        // Evita mandar el mismo aviso varias veces seguidas sin querer
        setTimeout(() => { btnAvisar.disabled = false; }, 20000);
    } catch (e) {
        console.error(e);
        alert(`No se pudo enviar el aviso: ${e.message}`);
        btnAvisar.disabled = false;
    }
}

btnAvisar.addEventListener("click", enviarEstoyEn);

async function iniciarAvisos() {
    if ("serviceWorker" in navigator) {
        try {
            swReg = await navigator.serviceWorker.register("sw.js");
        } catch (e) {
            console.error(e);
        }
    }

    await pintarEstadoAvisos();
    sincronizarSuscripcion();
}

iniciarAvisos();

cargar();
