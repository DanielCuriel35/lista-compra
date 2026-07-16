1. Rellena SUPABASE_URL y SUPABASE_KEY en supabase.js
2. Tabla:

create table productos(
 id uuid primary key default gen_random_uuid(),
 nombre text not null,
 comprado boolean default false,
 created_at timestamptz default now()
);

3. Permite SELECT, INSERT, UPDATE y DELETE mediante políticas RLS para pruebas.

