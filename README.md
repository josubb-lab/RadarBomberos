# Radar Bomberos — firefighter.es

Observatorio jurídico de oposiciones a bombero en España.

---

## Qué hace

Monitoriza señales de irregularidades en procesos selectivos de bomberos:
sentencias, impugnaciones, anulaciones, suspensiones cautelares y correcciones
de errores publicadas en el BOE y boletines autonómicos.

El opositor puede consultar si su convocatoria tiene señales activas, buscar
por ciudad o cuerpo, y recibir alertas. Los despachos de abogados y academias
pueden capturar leads cualificados.

---

## Estructura de la web

| Sección | URL | Descripción |
|---------|-----|-------------|
| Home | `/` | Hero, perfiles (opositor / abogado / academia), buscador, señales recientes, noticias |
| Oposiciones | `/oposiciones` | Listado de cuerpos de bomberos por ciudad |
| Detalle oposición | `/oposiciones/[slug]` | Requisitos, temario, academias, formulario de contacto |
| Observatorio | `/incidencias` | Buscador completo de señales jurídicas |
| Ciudad | `/[ciudad]` | Señales filtradas por ubicación |
| Aviso legal | `/aviso-legal` | — |
| Política privacidad | `/politica-privacidad` | — |
| Política cookies | `/politica-cookies` | — |

---

## Stack técnico

- **Frontend**: Astro 5 (SSG, build estático)
- **Estilos**: Tailwind CSS v4, tema dark (slate-950)
- **Base de datos**: Supabase
- **Hosting**: Vercel (auto-deploy en push a master)
- **Dominio**: firefighter.es

---

## Base de datos (Supabase)

| Tabla | Contenido | Quién escribe |
|-------|-----------|---------------|
| `hallazgos` | Señales jurídicas del BOE y boletines | Scraper |
| `noticias` | Noticias generales de Google News | Scraper |
| `leads` | Emails capturados desde formularios | Web (anon) |

RLS activado. La tabla `leads` solo permite INSERT anónimo.
Los leads también se notifican por email a josue@benchdatalab.com via Formsubmit.

---

## Scraper

Script: `scripts/scraper.js`
Ejecución: GitHub Actions, cron **lunes 6:00h**

### Fuentes

| Fuente | Tipo | Tabla destino |
|--------|------|---------------|
| BOE (API sumario JSON) | Señales jurídicas | `hallazgos` |
| DOGC | Señales jurídicas | `hallazgos` |
| BOB (Bizkaia) | Señales jurídicas | `hallazgos` |
| BOJA s51 + s52 | Señales jurídicas | `hallazgos` |
| Google News | Noticias generales | `noticias` |

### Flujo

1. Descarga señales de los últimos 7 días
2. Filtra por keywords: `bombero`, `bomberos`, `suhiltzaile`
3. Clasifica por tipo: `anulacion`, `impugnacion`, `sentencia`, `suspension`, `correccion`, `convocatoria`
4. Inserta en Supabase (dedup por URL)
5. Genera CSV de señales activas (`tipo != sentencia`, `relevancia >= 2`) en `exports/csv/`
6. Commit y push del CSV → dispara rebuild en Vercel

### CSV

Ruta: `exports/csv/senales-activas-bomberos-YYYY-MM-DD.csv`
Columnas: `titulo`, `tipo`, `fuente`, `fecha`, `relevancia`, `url`, `descripcion`
Primera línea: `# Generado: ISO timestamp` (garantiza cambio en git cada ejecución)

---

## Variables de entorno

```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_KEY=        # clave anon
SUPABASE_SERVICE_KEY=       # clave service_role (solo scraper)
VERCEL_DEPLOY_HOOK=         # opcional
PUBLIC_NICHO=bomberos
```

---

## SEO

- Title, meta description y canonical en todas las páginas
- Open Graph + Twitter Card (imagen: `/og-image.png`)
- JSON-LD: `WebSite` + `Organization` en home, `BreadcrumbList` en páginas internas
- Sitemap automático en `/sitemap-index.xml`
- `robots.txt` apuntando al sitemap
- Páginas de ciudad indexables

Para registrar en Google Search Console:
1. Verificar dominio con registro DNS TXT
2. Enviar sitemap: `https://firefighter.es/sitemap-index.xml`

---

## Repos

| Repo | Descripción |
|------|-------------|
| `josubb-lab/RadarBomberos` | Este proyecto (web + scraper) |
| `josubb-lab/radar-subvenciones` | Proyecto paralelo (radar-subvenciones.es) |
