/**
 * scripts/export.js
 * Exporta hallazgos clasificados a CSV.
 *
 * Uso:
 *   node --env-file=.env scripts/export.js [opciones]
 *
 * Opciones:
 *   --nicho=bomberos          (default: bomberos)
 *   --min-relevancia=2        (default: 2)
 *   --solo-curado             solo curado=true
 *   --desde=YYYY-MM-DD        fecha mínima
 *   --output=archivo.csv      si no se especifica, imprime a stdout
 *
 * Ejemplos:
 *   node --env-file=.env scripts/export.js
 *   node --env-file=.env scripts/export.js --min-relevancia=3
 *   node --env-file=.env scripts/export.js --output=bomberos-hoy.csv
 *   node --env-file=.env scripts/export.js --solo-curado --output=curado.csv
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync  } from 'fs';

const SUPABASE_URL    = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY    = process.env.PUBLIC_SUPABASE_KEY;

const nichoArg        = process.argv.find(a => a.startsWith('--nicho='))?.split('=')[1]          ?? 'bomberos';
const minRelevancia   = parseInt(process.argv.find(a => a.startsWith('--min-relevancia='))?.split('=')[1] ?? '2');
const soloCurado      = process.argv.includes('--solo-curado');
const desdeArg        = process.argv.find(a => a.startsWith('--desde='))?.split('=')[1]          ?? null;
const outputArg       = process.argv.find(a => a.startsWith('--output='))?.split('=')[1]         ?? null;

// ── CSV helpers ──────────────────────────────────────────────────────────────

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cols) {
  return cols.map(csvCell).join(',');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let query = supabase
    .from('hallazgos')
    .select('fecha, tipo, titulo, descripcion, fuente, url, relevancia, curado')
    .eq('nicho', nichoArg)
    .not('tipo', 'is', null)
    .order('fecha', { ascending: false, nullsFirst: false });

  if (soloCurado) {
    query = query.eq('curado', true);
  } else {
    query = query.gte('relevancia', minRelevancia);
  }

  if (desdeArg) {
    query = query.gte('fecha', desdeArg);
  }

  const { data, error } = await query;
  if (error) { console.error('❌ Error leyendo BD:', error.message); process.exit(1); }

  if (!data || data.length === 0) {
    process.stderr.write(`⚠ No hay hallazgos con los filtros aplicados.\n`);
    process.exit(0);
  }

  // Generar CSV
  const HEADERS = ['fecha', 'tipo', 'titulo', 'descripcion', 'fuente', 'url', 'relevancia', 'curado'];
  const lines   = [
    csvRow(HEADERS),
    ...data.map(r => csvRow([
      r.fecha, r.tipo, r.titulo, r.descripcion,
      r.fuente, r.url, r.relevancia, r.curado,
    ])),
  ];
  const csv = lines.join('\n') + '\n';

  if (outputArg) {
    writeFileSync(outputArg, csv, 'utf8');
    process.stderr.write(`✅ ${data.length} registros → ${outputArg}\n`);
  } else {
    process.stdout.write(csv);
    process.stderr.write(`\n✅ ${data.length} registros exportados\n`);
  }

  // Resumen por tipo (siempre a stderr para no contaminar el CSV en stdout)
  const porTipo = {};
  for (const r of data) porTipo[r.tipo] = (porTipo[r.tipo] ?? 0) + 1;
  process.stderr.write('\nDesglose:\n');
  for (const [tipo, n] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) {
    process.stderr.write(`  ${tipo.padEnd(20)} ${n}\n`);
  }
  process.stderr.write('\n');
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
