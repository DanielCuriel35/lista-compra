1. Rellena SUPABASE_URL y SUPABASE_KEY en supabase.js
2. Tabla:

create table productos(
 id uuid primary key default gen_random_uuid(),
 nombre text not null,
 comprado boolean default false,
 created_at timestamptz default now()
);

3. Permite SELECT, INSERT, UPDATE y DELETE mediante políticas RLS para pruebas.


4. Columna de usuario (quién añadió cada producto). Ejecuta en el SQL Editor de Supabase:

alter table productos add column if not exists usuario text;

Los usuarios y sus colores están en app.js (constante USUARIOS):
Daniel naranja, Diego rojo, Macu morado, Marina rosa.

5. Columna de supermercado (lidl, mercadona u otros). Ejecuta en el SQL Editor de Supabase:

alter table productos add column if not exists supermercado text;

Los supermercados y sus colores están en app.js (constante SUPERMERCADOS).

6. Registros de compras (botón "Compra hecha" y pestaña Registros). Ejecuta en el SQL Editor de Supabase:

create table if not exists registros (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 usuario text,
 productos jsonb not null default '[]'::jsonb
);

alter table registros enable row level security;
create policy "registros_select" on registros for select using (true);
create policy "registros_insert" on registros for insert with check (true);

-- Opcional: que la pestaña Registros se actualice sola en todos los móviles
alter publication supabase_realtime add table registros;
