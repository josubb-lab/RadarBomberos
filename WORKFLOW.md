# Workflow Semanal — Vigía Bomberos

Tiempo estimado: **15–20 minutos**.
Frecuencia recomendada: **cada lunes por la mañana**.

---

## Pasos

### 1. Ejecutar el scraper (5–10 min, automático)

```bash
npm run scraper:bomberos
```

Lanza las 4 fuentes (BOE, Google News, sentencias, Reddit).
Guarda hallazgos nuevos en Supabase automáticamente.

- Si hay muchos nuevos (>10): revisar manualmente los de `relevancia=1` por si hay señales que el clasificador no subió.
- Si hay 0 nuevos: normal. El scraper deduplicará contra lo que ya está en BD.

---

### 2. Clasificar nuevos hallazgos (1 min, automático)

```bash
npm run classify:bomberos
```

Solo clasifica los registros con `tipo IS NULL` (los recién insertados por el scraper).
Los ya clasificados no se tocan.

---

### 3. Curación manual en Supabase (5 min, manual)

Ir a Supabase → Table Editor → `hallazgos` → filtrar:
- `nicho = bomberos`
- `tipo IN (sentencia, impugnacion, anulacion, suspension, medida_cautelar)`
- `fecha >= hace 7 días`

Para cada señal nueva de esos tipos:
- Si es real y relevante: cambiar `relevancia` a 3 y `curado = true`
- Si es falso positivo o ruido: cambiar `relevancia` a 1

Criterios de curación:
| `relevancia=3 + curado=true` | `relevancia=1` |
|---|---|
| Sentencia con organismo y proceso específico | Sentencia sobre temas laborales (no oposición) |
| Impugnación con sindicato/organismo nombrado | Noticia política que menciona bomberos |
| Anulación de convocatoria real | Brigadistas forestales si no es tu segmento |
| BOE con corrección de sistema de selección | Artículos de seguimiento sin nueva acción jurídica |

---

### 4. Generar export + informe (1 min, automático)

```bash
npm run weekly:bomberos
```

Genera dos archivos en `exports/`:

```
exports/csv/vigia-bomberos-YYYY-MM-DD.csv      ← adjuntar al email
exports/informes/vigia-bomberos-semanal-YYYY-WW.md  ← revisar y enviar
```

---

### 5. Revisar y enviar (5 min, manual)

1. Abrir `exports/informes/vigia-bomberos-semanal-YYYY-WW.md`
2. Revisar que las señales de "Novedades esta semana" son correctas
3. Ajustar el texto de envío si hay algo destacable
4. Enviar por email:
   - Cuerpo: contenido del informe (o pegarlo como texto)
   - Adjunto: CSV de esa semana
5. Mover el CSV anterior a `exports/archivados/` si quieres mantener limpio

---

## Checklist semanal

```
VIGÍA BOMBEROS — Checklist semana ___/___

[ ] scraper ejecutado             npm run scraper:bomberos
[ ] clasificador ejecutado        npm run classify:bomberos
[ ] curación manual completada    (Supabase)
[ ] weekly ejecutado              npm run weekly:bomberos
[ ] informe revisado
[ ] email enviado a N clientes
[ ] CSV archivado si procede

Novedades esta semana: ___
Falsos positivos corregidos: ___
```

---

## Comandos de referencia

```bash
# Flujo completo semanal
npm run scraper:bomberos       # 1. Scraping
npm run classify:bomberos      # 2. Clasificar nuevos
# --- curación manual en Supabase ---
npm run weekly:bomberos        # 4. Export + informe

# Exports puntuales
npm run export:bomberos        # CSV a stdout

# Export con filtros (directo, sin npm run)
node --env-file=.env scripts/export.js --nicho=bomberos --min-relevancia=3
node --env-file=.env scripts/export.js --nicho=bomberos --solo-curado
node --env-file=.env scripts/export.js --nicho=bomberos --desde=2024-01-01

# Dry-run del clasificador (ver sin aplicar)
node --env-file=.env scripts/clasificar.js --nicho=bomberos --dry-run
```

---

## Estructura de archivos

```
exports/
  csv/          → CSVs semanales (vigia-bomberos-YYYY-MM-DD.csv)
  informes/     → Informes markdown (vigia-bomberos-semanal-YYYY-WW.md)
  archivados/   → CSVs e informes antiguos (mover manualmente)
```

---

## Señales de alerta (actuar de inmediato)

Si el scraper detecta alguno de estos tipos en la semana, priorizar:
- `medida_cautelar` — implica proceso judicial urgente activo
- `suspension` — convocatoria paralizada, alta visibilidad pública
- `sentencia` + organismo grande (Madrid, Barcelona, Valencia) — alto interés para clientes

En esos casos: enviar alerta separada antes del informe semanal.
