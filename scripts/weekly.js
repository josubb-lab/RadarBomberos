/**
 * scripts/weekly.js
 * Genera el export CSV semanal + informe markdown.
 *
 * Uso:
 *   node --env-file=.env scripts/weekly.js [--nicho=bomberos]
 *   npm run weekly:bomberos
 *
 * Output:
 *   exports/csv/vigia-{nicho}-{YYYY-MM-DD}.csv        ← producto vendible
 *   exports/informes/vigia-{nicho}-semanal-{YYYY-WW}.md
 *
 * El CSV exporta procesos con señal activa (estado != cerrado).
 * Una fila por señal — si un proceso tiene 3 señales, ocupa 3 filas.
 * Ordenado por fecha_señal DESC: los casos más recientes arriba.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_KEY;
const nicho        = process.argv.find(a => a.startsWith('--nicho='))?.split('=')[1] ?? 'bomberos';

// ── Fechas ────────────────────────────────────────────────────────────────────

function isoWeek(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const y     = date.getFullYear();
  const start = new Date(y, 0, 4);
  const wk    = 1 + Math.round(((date - start) / 86400000 - 3 + (start.getDay() || 7)) / 7);
  return { year: y, week: String(wk).padStart(2, '0') };
}

function fmtDate(d = new Date()) { return d.toISOString().slice(0, 10); }
function hace7Dias() { const d = new Date(); d.setDate(d.getDate() - 7); return fmtDate(d); }
function fmtLegible(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── CSV ───────────────────────────────────────────────────────────────────────

const CSV_COLS = [
  'organismo', 'provincia', 'comunidad', 'cuerpo', 'plazas',
  'estado', 'tipo_senal', 'fecha_senal', 'descripcion_proceso',
  'url_oficial', 'url_senal', 'fuente_senal', 'actualizado',
];

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(rows) {
  return [
    CSV_COLS.join(','),
    ...rows.map(r => CSV_COLS.map(c => csvCell(r[c])).join(',')),
  ].join('\n') + '\n';
}

// ── Etiquetas estado ──────────────────────────────────────────────────────────

const ESTADO_ES = {
  abierto:    'Abierto',
  activo:     'Activo',
  impugnado:  'Impugnado',
  suspendido: 'Suspendido',
  anulado:    'Anulado',
};

const ESTADO_ORDEN = { impugnado: 0, suspendido: 1, anulado: 2, abierto: 3, activo: 4 };

const TIPO_SENAL_ES = {
  sentencia:    'Sentencia',
  impugnacion:  'Impugnación',
  anulacion:    'Anulación',
  correccion:   'Corrección BOE',
  suspension:   'Suspensión',
  recurso:      'Recurso',
  convocatoria: 'Convocatoria',
};

// ── Informe markdown ──────────────────────────────────────────────────────────

function generarInforme({ nicho, fechaHoy, semana, procesos, novedades }) {
  const nichoLabel   = nicho.charAt(0).toUpperCase() + nicho.slice(1);
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - 7);

  // Agrupar filas CSV por proceso para el resumen
  const porProceso = {};
  for (const r of procesos) {
    if (!porProceso[r.organismo]) porProceso[r.organismo] = { ...r, senales: [] };
    porProceso[r.organismo].senales.push({ tipo: r.tipo_senal, fecha: r.fecha_senal });
  }
  const listaProcesos = Object.values(porProceso);

  const bloqueActivos = listaProcesos.length > 0
    ? listaProcesos.map(p => {
        const senalesStr = p.senales
          .map(s => `${TIPO_SENAL_ES[s.tipo] ?? s.tipo}${s.fecha ? ` (${s.fecha})` : ''}`)
          .join(', ');
        return `- **${p.organismo}** · ${p.provincia}\n` +
               `  Estado: ${ESTADO_ES[p.estado] ?? p.estado} · ${p.cuerpo}${p.plazas ? ` · ${p.plazas} plazas` : ''}\n` +
               `  Señales: ${senalesStr}`;
      }).join('\n')
    : '_Sin procesos activos con señal._';

  const bloqueNovedades = novedades.length > 0
    ? novedades.map(r =>
        `- **${r.titulo?.slice(0, 100)}**\n  Fuente: ${r.fuente} · ${r.fecha ?? '—'}`
      ).join('\n')
    : '_Sin señales nuevas en el observatorio esta semana._';

  return `# Vigía ${nichoLabel} — Informe Semanal
## Semana ${semana.week}/${semana.year} · ${fmtLegible(fmtDate(inicioSemana))} – ${fmtLegible(fechaHoy)}

---

## Procesos con señal activa — Estado del universo

_${listaProcesos.length} proceso${listaProcesos.length !== 1 ? 's' : ''} con señal · ${procesos.length} señal${procesos.length !== 1 ? 'es' : ''} total_

${bloqueActivos}

---

## Novedades observatorio esta semana

${bloqueNovedades}

---

## Para enviar al cliente

\`\`\`
Asunto: Vigía Bomberos — Informe Semanal ${semana.week}/${semana.year}

Adjunto el CSV actualizado con los procesos selectivos de bombero
que tienen señales jurídicas activas.

Procesos con señal activa: ${listaProcesos.length}
Señales totales documentadas: ${procesos.length}
Novedades esta semana en el observatorio: ${novedades.length}

Un saludo,
[Tu nombre]
\`\`\`

---
_Generado: ${fechaHoy} · Vigía ${nichoLabel}_
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY en .env');
    process.exit(1);
  }

  const sb       = createClient(SUPABASE_URL, SUPABASE_KEY);
  const fechaHoy = fmtDate();
  const semana   = isoWeek();

  console.log(`\n🗓  Vigía ${nicho} — semana ${semana.week}/${semana.year}\n`);

  // 1. Procesos con señal activa (estado != cerrado, con señales)
  const { data: procesosRaw = [], error: ep } = await sb
    .from('procesos_selectivos')
    .select(`
      organismo, provincia, comunidad, cuerpo, plazas,
      estado, descripcion, url_oficial, updated_at,
      senales_proceso(tipo, fecha, url, fuente)
    `)
    .eq('nicho', nicho)
    .neq('estado', 'cerrado')
    .order('updated_at', { ascending: false });

  if (ep) { console.error('❌ Error leyendo procesos:', ep.message); process.exit(1); }

  // Expandir: una fila por señal, ordenar por fecha_señal DESC
  const filas = [];
  for (const p of procesosRaw) {
    const senales = p.senales_proceso ?? [];
    if (senales.length === 0) continue; // solo procesos con señal
    for (const s of senales) {
      filas.push({
        organismo:           p.organismo,
        provincia:           p.provincia,
        comunidad:           p.comunidad,
        cuerpo:              p.cuerpo,
        plazas:              p.plazas,
        estado:              p.estado,
        tipo_senal:          s.tipo,
        fecha_senal:         s.fecha,
        descripcion_proceso: p.descripcion,
        url_oficial:         p.url_oficial,
        url_senal:           s.url,
        fuente_senal:        s.fuente,
        actualizado:         p.updated_at?.slice(0, 10),
      });
    }
  }

  // Ordenar: estado crítico primero, luego fecha señal DESC
  filas.sort((a, b) => {
    const eo = (ESTADO_ORDEN[a.estado] ?? 9) - (ESTADO_ORDEN[b.estado] ?? 9);
    if (eo !== 0) return eo;
    if (a.fecha_senal && b.fecha_senal) return b.fecha_senal.localeCompare(a.fecha_senal);
    if (a.fecha_senal) return -1;
    if (b.fecha_senal) return 1;
    return 0;
  });

  // 2. Novedades del observatorio esta semana (contexto para el informe)
  const { data: novedades = [] } = await sb
    .from('hallazgos')
    .select('tipo, fuente, fecha, titulo')
    .eq('nicho', nicho)
    .gte('relevancia', 2)
    .gte('fecha', hace7Dias())
    .in('tipo', ['sentencia', 'impugnacion', 'anulacion', 'suspension', 'medida_cautelar'])
    .order('fecha', { ascending: false, nullsFirst: false });

  // ── Guardar CSV ─────────────────────────────────────────────────────────────
  mkdirSync('exports/csv', { recursive: true });
  const csvPath = `exports/csv/vigia-${nicho}-${fechaHoy}.csv`;
  writeFileSync(csvPath, toCSV(filas), 'utf8');
  console.log(`📊 CSV → ${csvPath} (${filas.length} señales en ${procesosRaw.filter(p => (p.senales_proceso ?? []).length > 0).length} procesos)`);

  // ── Guardar informe ─────────────────────────────────────────────────────────
  mkdirSync('exports/informes', { recursive: true });
  const mdPath = `exports/informes/vigia-${nicho}-semanal-${semana.year}-${semana.week}.md`;
  writeFileSync(mdPath, generarInforme({ nicho, fechaHoy, semana, procesos: filas, novedades }), 'utf8');
  console.log(`📝 Informe → ${mdPath}`);

  // ── Resumen consola ─────────────────────────────────────────────────────────
  const porEstado = {};
  for (const f of filas) porEstado[f.estado] = (porEstado[f.estado] ?? 0) + 1;

  console.log(`\n── Resumen ────────────────────────────────────`);
  console.log(`   Procesos con señal activa:  ${procesosRaw.filter(p => (p.senales_proceso ?? []).length > 0).length}`);
  console.log(`   Señales totales en CSV:     ${filas.length}`);
  console.log(`   Por estado:`);
  for (const [estado, n] of Object.entries(porEstado).sort((a,b) => (ESTADO_ORDEN[a[0]]??9)-(ESTADO_ORDEN[b[0]]??9))) {
    console.log(`     ${(ESTADO_ES[estado] ?? estado).padEnd(12)} ${n}`);
  }
  console.log(`   Novedades observatorio:     ${novedades.length}`);
  console.log(`\n✅ Listo. Revisa el informe antes de enviar.\n`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
