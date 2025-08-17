# windsufertest

Proyecto base con ViteJS, AlpineJS, Tailwind CSS + daisyUI y PHP.

## Estructura sugerida
- `public/`: Archivos públicos y punto de entrada PHP
- `src/`: Código fuente del frontend (Vite)
- `backend/`: Código PHP (controladores, modelos, etc)

## Primeros pasos

1. Instala dependencias JS:
   ```bash
   npm install
   ```
2. Instala dependencias PHP (si usas Composer):
   ```bash
   composer install
   ```
3. Corre el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
4. Accede a `public/index.php` para probar el backend.

# windsufertest

Proyecto base con ViteJS, AlpineJS, Tailwind CSS + daisyUI y PHP.

## Estructura sugerida
- `public/`: Archivos públicos y punto de entrada PHP
- `src/`: Código fuente del frontend (Vite)
- `backend/`: Código PHP (controladores, modelos, etc)

## Primeros pasos

1. Instala dependencias JS:
   ```bash
   npm install
   ```
2. Instala dependencias PHP (si usas Composer):
   ```bash
   composer install
   ```
3. Corre el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
4. Accede a `public/index.php` para probar el backend.

## Dibujos para colorear (public/drawings)

Se añadió una sección "Dibujos para colorear" accesible desde la pantalla principal. Para mostrar los dibujos en forma de miniaturas y poder verlos/imprimirlos:

1. Coloca tus archivos de imagen (PNG/JPG/SVG/PDF) dentro de `public/drawings/`.
2. Lista esos archivos en `public/drawings/index.json` como un arreglo JSON. Puedes usar:
   - Solo nombres de archivo: `["unicornio.png", "sirena.jpg"]`
   - Objetos con título: `[{"src": "dragon.png", "title": "Dragón"}]`
3. Abre la app y entra a la sección "Dibujos para colorear". Haz clic en una miniatura para abrir el archivo en una nueva pestaña y usar la impresión del navegador.

Notas:
- Si `index.json` no existe o está vacío, verás un mensaje indicando cómo configurarlo.
- Las rutas se resuelven como `drawings/<archivo>` ya que el directorio `public/` se sirve como raíz.

## Migración de Local Storage a Supabase

En Configuración ahora hay un bloque para migrar los datos existentes de Local Storage a Supabase, sin borrar nada del almacenamiento local.

Qué datos necesitas de Supabase:
- Supabase URL del proyecto (ej.: `https://TU-PROJECT.supabase.co`).
- Supabase Anon Key (desde Project Settings > API > anon public). No uses la Service Role key en el frontend.
- Nombres de las tablas (por defecto `patients` y `reviews`).
- Esquema esperado de tablas (ajústalo si difiere):
  - Tabla `patients` con columnas: `id (uuid/text PK)`, `name (text)`, `gender (text)`, `birthdate (date/text)`, `photo_url (text)`, `created_at`, `updated_at`, `created_by`. 
  - Tabla `reviews` con columnas: `id (uuid, default uuid_generate_v4())`, `patient_id (uuid/text FK a patients.id)`, `date (date/text)`, `temperature (text/number)`, `symptoms (text)`, `test (text)`, `result (text)`, `position (text)`, `created_at`, `updated_at`, `created_by`. 
- Políticas RLS: habilita Row Level Security y crea políticas que permitan `insert` y `select` a `anon` en ambas tablas mientras solo hay un usuario (o limita por condiciones si lo prefieres). Si no hay políticas adecuadas, la API devolverá 401/403.

### Ejemplo rápido de RLS (solo para un único usuario de la app)
1. En Supabase, ve a SQL Editor y ejecuta (activa RLS si aún no lo está):
```sql
-- Activar RLS
alter table public.patients enable row level security;
alter table public.reviews enable row level security;

-- Políticas simples para permitir inserts/selects a cualquier usuario anónimo
-- Úsalas solo si no manejas multiusuario ni datos sensibles (juego/POC)
create policy "Allow anonymous select patients" on public.patients
  for select using (true);
create policy "Allow anonymous insert patients" on public.patients
  for insert with check (true);

create policy "Allow anonymous select reviews" on public.reviews
  for select using (true);
create policy "Allow anonymous insert reviews" on public.reviews
  for insert with check (true);
```
2. Si luego añades autenticación real o multiusuario, ajusta las políticas para filtrar por created_by o el user id.

Cómo usarlo:
1. Ve a Configuración > sección Supabase.
2. Rellena Supabase URL y Anon Key. Opcionalmente ajusta los nombres de tablas.
3. Pulsa "Guardar configuración".
4. Pulsa "Migrar a Supabase". Verás un mensaje con la cantidad de pacientes y revisiones enviadas. Los datos permanecen en Local Storage.

Notas técnicas:
- La migración usa la REST API de Supabase con fetch. Para pacientes se hace upsert usando `?on_conflict=id` y `Prefer: resolution=merge-duplicates`.
- Las revisiones se insertan en lotes de 500. Si tu tabla `reviews` requiere `id`, añade una columna con default `uuid_generate_v4()` o similar para evitar tener que generarla en el cliente.
- Si tus nombres de columnas difieren, ajusta el mapeo en `public/pages/Settings.html` dentro de la función `migrateToSupabase`.

