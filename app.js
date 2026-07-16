const list = document.getElementById("list");
const txt = document.getElementById("txtProduct");
const pending = document.getElementById("pending");
const done = document.getElementById("done");
const btnAdd = document.getElementById("btnAdd");

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
                    ${prod.nombre}
                </span>
            </div>

            <button class="delete">🗑️</button>
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

    const { error } = await client
        .from("productos")
        .insert({
            nombre: nombre,
            comprado: false
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