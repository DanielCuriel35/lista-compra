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
