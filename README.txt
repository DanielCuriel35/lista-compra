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

7. Avisos "Estoy en..." (notificaciones push)

7.1 SQL en Supabase:

create table if not exists suscripciones (
 endpoint text primary key,
 usuario text not null,
 suscripcion jsonb not null,
 updated_at timestamptz not null default now()
);

alter table suscripciones enable row level security;
-- Sin políticas a propósito: solo las funciones de Vercel (con la clave
-- service_role) pueden leer y escribir esta tabla. El navegador no la ve.

7.2 Variables de entorno en Vercel (Project → Settings → Environment Variables):

SUPABASE_URL               https://raforfyswzxkvqgnglxn.supabase.co
SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API Keys → clave "secret" / "service_role"
VAPID_PUBLIC_KEY           (clave pública de los avisos)
VAPID_PRIVATE_KEY          (clave privada de los avisos, ¡secreta!)
VAPID_SUBJECT              opcional, p. ej. mailto:tu-correo@ejemplo.com

Para generar un par de claves VAPID nuevo:  npx web-push generate-vapid-keys
Después de añadir o cambiar variables hay que volver a desplegar.

7.3 Cada persona pulsa "Activa los avisos en este móvil" una vez.
En iPhone primero hay que añadir la web a la pantalla de inicio y abrirla desde ese icono.
