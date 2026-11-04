const list = document.getElementById("list");
const txt = document.getElementById("txtProduct");
const pending = document.getElementById("pending");
const done = document.getElementById("done");
const btnAdd = document.getElementById("btnAdd");

/* ---------- Usuarios ---------- */

const USUARIOS = {
    Daniel: "#f57c00", // naranja
    Diego: "#d32f2f",  // rojo
    Macu: "#7b1fa2",   // morado
    Marina: "#e91e63"  // rosa
};

const login = document.getElementById("login");
const userButtons = document.getElementById("userButtons");
const currentUser = document.getElementById("currentUser");
const btnChangeUser = document.getElementById("btnChangeUser");

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

function etiquetaUsuario(nombre) {
    if (!nombre) return "";
    const color = USUARIOS[nombre] || "#9e9e9e";
    return `<span class="user-tag" style="background:${color}">${escapar(nombre)}</span>`;
}

function mostrarLogin() {
    login.classList.remove("hidden");
}

function elegirUsuario(nombre) {
    usuario = nombre;
    try { localStorage.setItem("usuario", nombre); } catch (e) { }
    login.classList.add("hidden");
    currentUser.innerHTML = `Eres ${etiquetaUsuario(nombre)}`;
    txt.focus();
}

Object.entries(USUARIOS).forEach(([nombre, color]) => {
    const b = document.createElement("button");
    b.textContent = nombre;
    b.style.background = color;
    b.addEventListener("click", () => elegirUsuario(nombre));
    userButtons.appendChild(b);
});

btnChangeUser.addEventListener("click", mostrarLogin);

if (usuario) elegirUsuario(usuario);
else mostrarLogin();

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

function pintar(datos) {
    list.innerHTML = "";

    let pendientes = 0;
    let comprados = 0;

    datos.forEach(prod => {

        if (prod.comprado)
            comprados++;
        else
            pendientes++;

        const row = document.createElement("div");
        row.className = "item";

        row.innerHTML = `
            <div class="left">
                <input type="checkbox" ${prod.comprado ? "checked" : ""}>
                <span class="${prod.comprado ? "done" : ""}">
                    ${escapar(prod.nombre)}
                </span>
            </div>

            <div class="right">
                ${etiquetaUsuario(prod.usuario)}
                <button class="delete">🗑️</button>
            </div>
        `;

        row.querySelector("input").addEventListener("change", async () => {
            await marcar(prod.id, !prod.comprado);
        });

        row.querySelector(".delete").addEventListener("click", async () => {
            if (confirm(`¿Eliminar "${prod.nombre}"?`)) {
                await borrar(prod.id);
            }
        });

        list.appendChild(row);
    });

    pending.textContent = `Pendientes: ${pendientes}`;
    done.textContent = `Comprados: ${comprados}`;
}

async function insertar() {

    const nombre = txt.value.trim();

    if (!nombre) return;

    if (!usuario) {
        mostrarLogin();
        return;
    }

    const { error } = await client
        .from("productos")
        .insert({
            nombre: nombre,
            comprado: false,
            usuario: usuario
        });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    txt.value = "";

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
        return;
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

btnAdd.addEventListener("click", insertar);

txt.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        insertar();
    }
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