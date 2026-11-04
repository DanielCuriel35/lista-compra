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

/* ---------- Confirmación de borrado ---------- */

const confirmBox = document.getElementById("confirm");
const confirmText = document.getElementById("confirmText");

function confirmar(texto) {
    return new Promise(resolve => {
        confirmText.innerHTML = texto;
        confirmBox.classList.remove("hidden");

        const cerrar = valor => {
            confirmBox.classList.add("hidden");
            confirmBox.onclick = null;
            document.onkeydown = null;
            resolve(valor);
        };

        document.getElementById("confirmYes").onclick = () => cerrar(true);
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

function pintar(datos) {
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
    .subscribe();

cargar();
