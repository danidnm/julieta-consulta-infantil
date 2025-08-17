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

