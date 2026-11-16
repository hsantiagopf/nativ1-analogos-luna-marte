# Guía de Alojamiento, Despliegue y Configuración de Dominio
### NASA Space Apps Challenge 2026 — Análogos Terrestres de la Luna y Marte
**Frontend Interactivo Jamstack (React 19 + TypeScript + Vite + MapLibre GL)**

---

## 1. Introducción y Arquitectura de Despliegue

El frontend interactivo del proyecto ha sido concebido bajo la arquitectura moderna **Jamstack (JavaScript, APIs y Markup pre-renderizado)**. La interfaz es una *Single Page Application* (SPA) de alto rendimiento construida con **Vite, React 19, TypeScript y MapLibre GL**, ubicada en el subdirectorio `frontend/`.

En esta arquitectura, la aplicación compila a un conjunto de ficheros estáticos optimizados (HTML, CSS, JS minificado, mapas vectoriales, imágenes de relieve *hillshade* y datasets JSON). **No requiere un servidor backend en tiempo de ejecución (Node.js/Python serverless o dedicado en producción)**, ya que consume directamente en el navegador del cliente los artefactos analíticos precalculados ubicados en disco (`out/all_rankings.json`, `out/distancias_*.json`, `out/hillshade/*.png`).

### ¿Por qué Netlify es la plataforma recomendada?
1. **Red Global de Distribución Anycast (Edge CDN):** El contenido se distribuye de manera instantánea a decenas de centros de datos en el mundo. Cuando un juez de la NASA evalúe la aplicación desde Estados Unidos, Europa o Latinoamérica, los datasets JSON y los assets se servirán desde el nodo geográficamente más próximo con latencias inferiores a 30 ms.
2. **Despliegues Atómicos e Inmutables:** Cada actualización a la rama de producción (`main`) genera una instantánea versionada e inmutable. Si una compilación falla, el sitio en producción nunca se rompe ni muestra estados intermedios.
3. **Gestión Automatizada de SSL/TLS (Let's Encrypt):** Aprovisionamiento y renovación automática sin costo de certificados HTTPS para el dominio raíz y subdominios.
4. **Manejo Nativo de Enrutamiento SPA:** Soporte transparente de reescrituras HTTP 200 (`/* /index.html 200`) para que la navegación con HTML5 History API no devuelva errores 404 al recargar la página.
5. **Cero Mantenimiento de Infraestructura:** Sin parches de sistema operativo, sin escalado manual de servidores y con un plan gratuito extraordinariamente holgado para hackathons y proyectos de demostración.

---

## 2. Configuración del Proyecto y Compilación en Netlify

El repositorio está estructurado como un monorepo que alberga tanto el núcleo científico en Python (raíz) como la aplicación web (`frontend/`):

```text
NASA_SpaceApps26/
├── frontend/                     # Aplicación SPA cliente
│   ├── public/                   # Archivos estáticos directos (iconos, geojson, etc.)
│   ├── src/                      # Código fuente React / TypeScript
│   ├── index.html                # Entrada HTML de Vite
│   ├── package.json              # Dependencias y scripts de compilación
│   ├── tsconfig.json             # Configuración TypeScript
│   └── vite.config.ts            # Configuración de empaquetado Vite
├── out/                          # Artefactos analíticos generados por model.py
│   ├── all_rankings.json         # Dataset maestro consumido por el frontend
│   ├── distancias_MOON.json      # Distancias multiescala lunares
│   ├── distancias_MARS.json      # Distancias multiescala marcianas
│   └── hillshade/                # 66 imágenes PNG y matrices .npy
├── netlify.toml                  # Configuración de compilación, rutas y cabeceras
└── GUIA_DESPLIEGUE_HOSTING.md    # Este documento maestro
```

### 2.1. Ajustes en la consola de Netlify (Build Settings)
Al conectar el repositorio de GitHub/GitLab en el panel de Netlify (*Site configuration > Build & deploy*):

- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `dist` (al haber establecido la base en `frontend`, la ruta de publicación se interpreta como `frontend/dist`).
- **Node Version:** Establecer la variable de entorno `NODE_VERSION = "20"` (o `"18"`).

### 2.2. Fichero de configuración maestro: `netlify.toml`
Se debe colocar un archivo `netlify.toml` en la **raíz del repositorio** (o en la carpeta `frontend/`). Este archivo tiene precedencia sobre cualquier ajuste manual en la interfaz de Netlify:

```toml
# ==============================================================================
# netlify.toml — Configuración de producción para NASA Space Apps 2026
# ==============================================================================

[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

# ------------------------------------------------------------------------------
# Contexto de Producción (rama principal)
# ------------------------------------------------------------------------------
[context.production]
  command = "npm run build"

# ------------------------------------------------------------------------------
# Contexto de Deploy Previews (Pull Requests de colaboradores)
# ------------------------------------------------------------------------------
[context.deploy-preview]
  command = "npm run build"

# ------------------------------------------------------------------------------
# Reglas de Redirección y Reescritura para SPA (Single Page Application)
# ------------------------------------------------------------------------------
# Esencial para evitar errores 404 cuando el usuario o un juez recarga
# rutas profundas de la aplicación (ej: /moon, /mars, /analisis/antofalla).
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# ------------------------------------------------------------------------------
# Cabeceras de Seguridad y Optimización de Caché (HTTP Security & Caching)
# ------------------------------------------------------------------------------
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

# Cache-Control estricto para index.html (revalidación inmediata para nuevos despliegues)
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# Cache-Control inmutable para assets versionados por hash de Vite (1 año)
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache-Control para datasets JSON y mapas estáticos
[[headers]]
  for = "/*.json"
  [headers.values]
    Cache-Control = "public, max-age=3600, stale-while-revalidate=86400"
    Access-Control-Allow-Origin = "*"
```

---

## 3. Vinculación del Dominio de GoDaddy con Netlify: Análisis de Métodos

Para vincular un dominio personalizado registrado en **GoDaddy** (por ejemplo, `tudominioespacial.com` o `nasa-analogs.org`), existen dos métodos oficiales. A continuación se analizan en detalle para permitir tomar la mejor decisión según la arquitectura deseada.

---

### MÉTODO A: Netlify DNS (Delegación de Servidores de Nombres / Nameservers)
*Recomendado para proyectos nuevos o independientes que buscan el máximo rendimiento de red y configuración automática.*

#### ¿En qué consiste?
Se delega la gestión completa de la zona DNS a la infraestructura de Netlify (gestionada sobre la red Anycast de alto rendimiento de NS1). GoDaddy continúa siendo el registrador legal del dominio, pero Netlify se convierte en la autoridad que responde a cualquier consulta en Internet sobre el dominio.

#### Ventajas:
- **Soporte nativo de ALIAS / ANAME para el dominio raíz (Apex):** Permite que `tudominio.com` apunte dinámicamente a la red CDN sin estar atado a una dirección IP fija.
- **Rendimiento Anycast superior:** Las consultas DNS se resuelven en los servidores de nombres más cercanos al usuario en todo el planeta.
- **Gestión automática de registros SSL:** La validación de los certificados Let's Encrypt ocurre de forma instantánea sin requerir registros TXT de comprobación manual.

#### Desventajas:
- Si ya tienes servicios de correo corporativo contratados en GoDaddy (como Microsoft 365), deberás copiar manualmente sus registros MX, TXT y SPF en Netlify DNS antes de cambiar los servidores de nombres, o el correo dejará de funcionar temporalmente.

#### Procedimiento paso a paso para el Método A:

##### Paso 1: Configurar el dominio en Netlify
1. Accede al panel de control de Netlify (`app.netlify.com`).
2. Selecciona tu proyecto y ve a **Site configuration > Domain management**.
3. En la sección **Custom domains**, haz clic en **Add a domain**.
4. Escribe el nombre de tu dominio comprado en GoDaddy (ej. `tudominio.com`) y haz clic en **Verify**.
5. Aparecerá un cuadro de diálogo indicando que el dominio ya tiene propietario; pulsa **Add domain**.
6. Haz clic en **Set up Netlify DNS** junto a tu dominio.
7. Netlify mostrará una lista de 4 servidores de nombres de tipo:
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`
   *(Copia estos 4 valores).*

##### Paso 2: Cambiar los Servidores de Nombres en GoDaddy
1. Inicia sesión en tu cuenta de [GoDaddy](https://www.godaddy.com/).
2. Dirígete a la sección **Mis Productos** (*My Products*) y busca el apartado **Dominios** (*Domains*).
3. Localiza tu dominio y haz clic en el botón **DNS** o en los tres puntos (`...`) y selecciona **Administrar DNS** (*Manage DNS*).
4. Desplázate hacia abajo hasta la tarjeta **Servidores de nombres** (*Nameservers*) y haz clic en **Cambiar** (*Change*).
5. Selecciona la opción **Usar mis propios servidores de nombres (avanzado)** (*Enter my own nameservers (advanced)*).
6. Pega los 4 servidores de nombres proporcionados por Netlify en las casillas correspondientes. (Usa el botón *"Agregar servidor de nombres"* para completar los 4).
7. Haz clic en **Guardar** (*Save*). GoDaddy mostrará una advertencia de consentimiento de seguridad; marca la casilla de autorización y confirma.

---

### MÉTODO B: DNS Externo en GoDaddy (Conservar Nameservers de GoDaddy)
*Recomendado si ya tienes servicios de correo (Microsoft 365, Google Workspace) o subdominios existentes en GoDaddy que no deseas alterar.*

#### ¿En qué consiste?
Los servidores de nombres permanecen en GoDaddy. En la tabla de registros DNS de GoDaddy se crean apuntadores específicos (registros `A` y `CNAME`) que dirigen el tráfico web hacia los balanceadores de carga de Netlify.

#### Requisito arquitectónico crítico de Netlify para DNS externo:
En Netlify, el subdominio `www.tudominio.com` **debe configurarse como el Primary domain (dominio principal)**, y el dominio apex `tudominio.com` funcionará como una redirección automática hacia `www`.
- *Motivo técnico:* Las especificaciones de Internet (RFC 1034/1035) prohíben configurar un registro CNAME en el dominio raíz (`@`). Por tanto, el dominio raíz debe usar un registro `A` apuntando a una IP fija (`75.2.60.5`). Si usas la IP fija como dominio primario, el tráfico pierde parte de la resiliencia multirregión de Anycast. En cambio, `www` con CNAME resuelve dinámicamente al punto de presencia más rápido.

#### Procedimiento paso a paso para el Método B:

##### Paso 1: Configurar el dominio en Netlify
1. En Netlify, ve a **Site configuration > Domain management > Add a domain**.
2. Escribe tu dominio `tudominio.com` y pulsa **Verify > Add domain**.
3. En la lista de dominios, asegúrate de que aparezcan tanto `tudominio.com` como `www.tudominio.com`.
4. Haz clic en el botón de opciones (`...`) junto a `www.tudominio.com` y selecciona **Set as primary domain**.

##### Paso 2: Configurar los registros DNS en GoDaddy
1. En GoDaddy, ve a **Mis Productos > Dominios > Administrar DNS**.
2. En la pestaña **Registros DNS** (*DNS Records*):
3. **Configurar el subdominio WWW (Registro CNAME):**
   - Si ya existe un registro CNAME con nombre `www`, haz clic en el lápiz para editarlo. Si no, pulsa **Agregar registro** (*Add Record*).
   - **Tipo:** `CNAME`
   - **Nombre / Host:** `www`
   - **Valor / Datos:** `<nombre-de-tu-sitio>.netlify.app` *(sustituye por el subdominio que Netlify asignó a tu proyecto en Site Overview, por ejemplo: `spaceapps-nasa-analogs.netlify.app`)*.
   - **TTL:** `1/2 hora` (o `1 hora` / 3600 segundos).
4. **Configurar el dominio raíz Apex (Registro A):**
   - Si existe un registro `A` con nombre `@` apuntando a una IP de estacionamiento (*parking*) de GoDaddy (ej. `34.102.136.180`), edítalo.
   - **Tipo:** `A`
   - **Nombre / Host:** `@`
   - **Valor / Datos:** `75.2.60.5` *(IP oficial del balanceador de carga global de Netlify)*.
   - *(Opcional)* Si tu proveedor permite un segundo registro de respaldo, puedes añadir la IP secundaria de Netlify: `99.83.231.113`.
   - **TTL:** `1/2 hora` (o `1 hora` / 3600 segundos).
5. Elimina cualquier registro de redirección de reenvío (*Domain Forwarding*) que esté configurado en GoDaddy para evitar conflictos o bucles de redirección.

---

## 4. Aprovisionamiento y Configuración de Certificados HTTPS / SSL

Netlify proporciona certificados SSL/TLS automáticos y gratuitos a través de la entidad certificadora **Let's Encrypt**.

### Proceso de emisión
1. Una vez guardados los registros DNS en GoDaddy, la entidad certificadora de Let's Encrypt debe comprobar que el dominio realmente apunta a los servidores de Netlify.
2. En el panel de Netlify, ve a **Site configuration > Domain management > HTTPS**.
3. Al principio, verás el estado en amarillo: *"Waiting for DNS propagation"* o *"Certificate issuance pending"*.
4. Cuando hayan transcurrido entre 10 y 30 minutos (tras la propagación del registro CNAME), haz clic en el botón **Verify DNS configuration** y luego en **Provision certificate**.
5. En pocos segundos, el estado cambiará a verde: **"Your site has HTTPS enabled"**. El certificado cubrirá tanto `tudominio.com` como `www.tudominio.com`.
6. **Forzar HTTPS:** Asegúrate de activar la opción **Force HTTPS** (redirige automáticamente cualquier visita en `http://` no segura hacia `https://` con código HTTP 301 permanente).

---

## 5. Guía de Diagnóstico y Resolución de Problemas Frecuentes

### Problema 1: "El sitio no abre inmediatamente después de cambiar el DNS"
- **Causa:** Propagación DNS y caché del Time-To-Live (TTL). Los servidores DNS de los proveedores de internet (ISP) almacenan los registros anteriores durante el tiempo fijado por el TTL.
- **Tiempos esperados:**
  - Método A (cambio de Nameservers): Entre 2 y 24 horas (habitualmente menos de 2 horas en áreas urbanas).
  - Método B (registros A / CNAME): Entre 15 minutos y 2 horas.
- **Comprobación independiente:** No utilices tu navegador habitual (que puede tener caché DNS local). Usa una herramienta global de propagación:
  - [whatsmydns.net](https://www.whatsmydns.net/)
  - Ingresa `www.tudominio.com`, selecciona `CNAME` y verifica que los servidores globales muestren `<tu-app>.netlify.app`.

### Problema 2: Error 404 al recargar una ruta interna de la aplicación (ej: `/moon` o `/mars`)
- **Causa:** Vite genera un SPA donde sólo existe físicamente el archivo `index.html`. Si un usuario o juez recarga directamente la URL `tudominio.com/moon`, el servidor web de Netlify busca una carpeta `/moon/` en disco que no existe y devuelve un error 404 estándar.
- **Solución comprobada:** Asegúrate de que el archivo `netlify.toml` incluya la sección de redirección:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
  O alternativamente, crea un archivo de texto plano llamado `_redirects` (sin extensión) dentro de `frontend/public/` con la siguiente línea exacta:
  ```text
  /*    /index.html   200
  ```

### Problema 3: "DNS verification failed" o Fallo al emitir el certificado SSL
- **Causa común A:** Presencia de registros DNS obsoletos en GoDaddy. Si mantienes registros A antiguos apuntando al servidor de prueba de GoDaddy junto al nuevo registro, Let's Encrypt intentará validar contra la IP errónea.
  - *Solución:* Elimina cualquier registro A adicional con host `@` o `www` que no pertenezca a Netlify.
- **Causa común B:** Registros CAA (Certification Authority Authorization) restrictivos. Algunos dominios en GoDaddy vienen con registros CAA que sólo autorizan a emitir certificados a ciertas entidades.
  - *Solución:* En los registros DNS de GoDaddy, si existe un registro tipo `CAA`, añade una entrada que permita a Let's Encrypt:
    - Host: `@` | Tipo: `CAA` | Tag: `issue` | Valor: `letsencrypt.org`.

### Problema 4: Bucle de redirecciones infinitas (ERR_TOO_MANY_REDIRECTS)
- **Causa:** Ocurre si has configurado una regla de "Reenvío de dominio" (*Domain Forwarding*) en la consola de GoDaddy al mismo tiempo que tienes configurada la redirección en Netlify.
- **Solución:** Desactiva completamente el "Reenvío de dominio" en el panel de GoDaddy. Deja que Netlify gestione de forma exclusiva la redirección entre `tudominio.com` y `www.tudominio.com`.

---

## 6. Comandos de Verificación por Consola (CLI)

Puedes comprobar el estado de resolución de tu dominio en cualquier momento abriendo un terminal (PowerShell en Windows o Bash en macOS/Linux):

### En Windows (PowerShell):
```powershell
# 1. Comprobar resolución del registro CNAME de www
Resolve-DnsName -Name www.tudominio.com -Type CNAME

# 2. Comprobar resolución del registro A del dominio raíz
Resolve-DnsName -Name tudominio.com -Type A

# 3. Comprobar servidores de nombres autoritativos (Nameservers)
Resolve-DnsName -Name tudominio.com -Type NS
```

### En Linux / macOS / Git Bash:
```bash
# 1. Consultar CNAME
dig www.tudominio.com CNAME +short

# 2. Consultar dirección IP (Registro A)
dig tudominio.com A +short

# 3. Inspeccionar cabeceras HTTP y redirección SSL en vivo
curl -ILs https://www.tudominio.com | grep -E "HTTP|location"
```

---

## 7. Alternativas de Despliegue Jamstack: Vercel y Cloudflare Pages

Si el equipo decidiera optar por una plataforma alternativa de despliegue estático, los pasos equivalentes son:

| Característica | Netlify (Recomendado) | Vercel | Cloudflare Pages |
|---|---|---|---|
| **Tipo de despliegue** | Jamstack / Global Anycast CDN | Jamstack / Edge Network | Cloudflare Global Edge Network |
| **Registro A para Apex** | `75.2.60.5` | `76.76.21.21` | CNAME Flattening automático |
| **Registro CNAME para www** | `<sitio>.netlify.app` | `cname.vercel-dns.com` | `<proyecto>.pages.dev` |
| **Configuración SPA** | `_redirects` o `netlify.toml` | `vercel.json` | `_routes.json` o `_redirects` |
| **Integración Git** | Automática (GitHub/GitLab) | Automática (GitHub/GitLab) | Automática (GitHub/GitLab) |

### Despliegue rápido en Vercel con GoDaddy:
1. Conectar el repositorio en [vercel.com](https://vercel.com).
2. Root Directory: `frontend`. Framework preset: `Vite`.
3. En **Project Settings > Domains**, agregar `tudominio.com` y seleccionar la opción recomendada: `www.tudominio.com` (redirecting from `tudominio.com`).
4. En GoDaddy:
   - Registro `A` (`@`) apuntando a `76.76.21.21`.
   - Registro `CNAME` (`www`) apuntando a `cname.vercel-dns.com`.

### Despliegue rápido en Cloudflare Pages con GoDaddy:
1. En el panel de Cloudflare, crear un proyecto en **Workers & Pages > Pages > Connect to Git**.
2. Build command: `npm run build`, Build output directory: `dist`, Root directory: `/frontend`.
3. En **Custom Domains**, vincular `tudominio.com`.
4. Si se delegan los Nameservers a Cloudflare, se activa automáticamente el *CNAME Flattening* en la raíz sin requerir una IP fija.

---

## 8. Checklist Previo al Lanzamiento Oficial para los Jueces

Antes de compartir la URL con el comité evaluador de la NASA Space Apps Challenge, verificar minuciosamente la siguiente lista de control:

- [ ] **Compilación limpia:** `npm run build` en `frontend/` finaliza con código de salida `0` y sin errores de tipado TypeScript ni dependencias faltantes.
- [ ] **Carga de datos verificada:** La aplicación en producción carga con éxito `all_rankings.json` y muestra las probabilidades SMAA Top-3 y los hillshades sin errores 404 en la consola del navegador.
- [ ] **Ambas vistas operativas:** Las pestañas de **Análisis Tierra-Luna** y **Análisis Tierra-Marte** funcionan de forma independiente.
- [ ] **Honestidad científica visible:** Cada sitio muestra claramente sus quiebres de la analogía (`where_it_breaks_down`) y su utilidad específica para misiones (`mission_utility`). No se lee el término "el mejor análogo".
- [ ] **Redirección SPA probada:** Recargar manualmente con F5 en una subruta (ej. `https://tudominio.com/moon`) no produce un error 404 de servidor.
- [ ] **Candado HTTPS activo:** El navegador muestra el candado de conexión segura válida y certificada por Let's Encrypt sin advertencias de contenido mixto (*mixed content*).
- [ ] **Redirección de dominio canónico:** Visitar `http://tudominio.com` redirige con código 301 a `https://www.tudominio.com` (o al dominio primario seleccionado).
- [ ] **Compatibilidad móvil y de escritorio:** La interfaz responde con fluidez en pantallas grandes de jueces y en dispositivos táctiles.
