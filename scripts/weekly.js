/**
 * scripts/weekly.js
 * Genera el export CSV semanal + informe markdown en un solo comando.
 *
 * Uso:
 *   node --env-file=.env scripts/weekly.js [--nicho=bomberos]
 *   npm run weekly:bomberos
 *
 * Output:
 *   exports/csv/vigia-{nicho}-{YYYY-MM-DD}.csv
 *   exports/informes/vigia-{nicho}-semanal-{YYYY-WW}.md
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

function fmtDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function hace7Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return fmtDate(d);
}

function fmtLegible(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(rows) {
  const COLS = ['fecha', 'tipo', 'titulo', 'descripcion', 'fuente', 'url', 'relevancia', 'curado'];
  return [
    COLS.join(','),
    ...rows.map(r => COLS.map(c => csvCell(r[c])).join(',')),
  ].join('\n') + '\n';
}

// ── Etiquetas ─────────────────────────────────────────────────────────────────

const TIPO_ES = {
  sentencia:        'Sentencia',
  impugnacion:      'Impugnación',
  anulacion:        'Anulación',
  correccion_bases: 'Corrección BOE',
  suspension:       'Suspensión',
  medida_cautelar:  'Medida cautelar',
  psicotecnico:     'Psicotécnico',
  denuncia:         'Denuncia (foro)',
  noticia:          'Noticia',
};

const TIPO_ICON = {
  sentencia:        '⚖️',
  impugnacion:      '🚨',
  anulacion:        '❌',
  correccion_bases: '📋',
  suspension:       '⏸️',
  medida_cautelar:  '⛔',
  psicotecnico:     '🧠',
  denuncia:         '💬',
  noticia:          '📰',
};

function etiqueta(tipo) {
  return `${TIPO_ICON[tipo] ?? '•'} ${TIPO_ES[tipo] ?? tipo}`;
}

function limpiarTitulo(titulo = '') {
  return titulo.replace(/ - [^-]{3,40}$/, '').trim(); // quita " - NombreFuente" al final
}

// ── Informe markdown ──────────────────────────────────────────────────────────

function generarInforme({ nicho, fechaHoy, semana, novedades, top10, stats }) {
  const nichoLabel = nicho.charAt(0).toUpperCase() + nicho.slice(1);
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - 7);

  const bloqueNovedades = novedades.length > 0
    ? novedades.map(r =>
        `### ${etiqueta(r.tipo)} · ${fmtLegible(r.fecha)}\n` +
        `**${limpiarTitulo(r.titulo)}**\n` +
        (r.descripcion && r.descripcion !== r.titulo
          ? `> ${r.descripcion.slice(0, 200)}\n`
          : '') +
        `Fuente: ${r.fuente}\n`
      ).join('\n')
    : '_Sin señales nuevas esta semana._\n';

  const bloqueTop = top10.map((r, i) =>
    `${i + 1}. **[${TIPO_ES[r.tipo] ?? r.tipo}]** · ${r.fecha ?? '—'}\n` +
    `   ${limpiarTitulo(r.titulo)}\n` +
    `   _${r.fuente}_\n`
  ).join('\n');

  const bloqueStats = Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, n]) => `| ${TIPO_ES[tipo] ?? tipo} | ${n} |`)
    .join('\n');

  const total = Object.values(stats).reduce((s, n) => s + n, 0);

  return `# Vigía ${nichoLabel} — Informe Semanal
## Semana ${semana.week}/${semana.year} · ${fmtLegible(fmtDate(inicioSemana))} – ${fmtLegible(fechaHoy)}

---

## Novedades esta semana

${bloqueNovedades}

---

## Señales activas destacadas

${bloqueTop}

---

## Dataset acumulado

| Tipo | Señales |
|---|---|
${bloqueStats}
| **TOTAL** | **${total}** |

_CSV completo adjunto: \`vigia-${nicho}-${fechaHoy}.csv\`_

---

## Para enviar al cliente

\`\`\`
Asunto: Vigía Bomberos — Informe Semanal ${semana.week}/${semana.year}

Adjunto el informe semanal y el CSV actualizado.

Esta semana: ${novedades.length} señal${novedades.length !== 1 ? 'es' : ''} nueva${novedades.length !== 1 ? 's' : ''} detectada${novedades.length !== 1 ? 's' : ''}.
Dataset total: ${total} señales verificadas.

Un saludo,
[Tu nombre]
\`\`\`

---
_Generado: ${fechaHoy} · Vigía Bomberos_
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
  const desde7d  = hace7Dias();

  console.log(`\n🗓  Vigía ${nicho} — semana ${semana.week}/${semana.year}\n`);

  // 1. Señales nuevas esta semana (rel >= 2)
  const { data: novedades = [] } = await sb
    .from('hallazgos')
    .select('tipo, relevancia, fuente, fecha, titulo, descripcion, url')
    .eq('nicho', nicho)
    .gte('relevancia', 2)
    .gte('fecha', desde7d)
    .order('fecha', { ascending: false, nullsFirst: false });

  // 2. Top 10 señales curadas o de alta relevancia (para el informe)
  const { data: top10raw = [] } = await sb
    .from('hallazgos')
    .select('tipo, relevancia, fuente, fecha, titulo, url')
    .eq('nicho', nicho)
    .gte('relevancia', 2)
    .in('tipo', ['sentencia', 'impugnacion', 'anulacion', 'suspension', 'medida_cautelar'])
    .not('titulo', 'ilike', '%lista provisional%')
    .not('titulo', 'ilike', '%lista definitiva%')
    .order('fecha', { ascending: false, nullsFirst: false })
    .limit(10);

  // 3. Dataset completo para CSV (rel >= 2)
  const { data: csvData = [] } = await sb
    .from('hallazgos')
    .select('fecha, tipo, titulo, descripcion, fuente, url, relevancia, curado')
    .eq('nicho', nicho)
    .not('tipo', 'is', null)
    .gte('relevancia', 2)
    .order('fecha', { ascending: false, nullsFirst: false });

  // Estadísticas
  const stats = {};
  for (const r of csvData) stats[r.tipo] = (stats[r.tipo] ?? 0) + 1;

  // ── Guardar CSV ─────────────────────────────────────────────────────────────
  mkdirSync('exports/csv', { recursive: true });
  const csvPath = `exports/csv/vigia-${nicho}-${fechaHoy}.csv`;
  writeFileSync(csvPath, toCSV(csvData), 'utf8');
  console.log(`📊 CSV → ${csvPath} (${csvData.length} registros)`);

  // ── Guardar informe ─────────────────────────────────────────────────────────
  mkdirSync('exports/informes', { recursive: true });
  const mdPath = `exports/informes/vigia-${nicho}-semanal-${semana.year}-${semana.week}.md`;
  const md = generarInforme({ nicho, fechaHoy, semana, novedades, top10: top10raw, stats });
  writeFileSync(mdPath, md, 'utf8');
  console.log(`📝 Informe → ${mdPath}`);

  // ── Resumen consola ─────────────────────────────────────────────────────────
  console.log(`\n── Resumen ───────────────────────────────────`);
  console.log(`   Novedades esta semana (rel≥2):  ${novedades.length}`);
  console.log(`   Dataset total exportado:        ${csvData.length}`);
  console.log(`   Distribución:`);
  for (const [tipo, n] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${(TIPO_ES[tipo] ?? tipo).padEnd(20)} ${n}`);
  }
  console.log(`\n✅ Listo. Revisa el informe antes de enviar.\n`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
