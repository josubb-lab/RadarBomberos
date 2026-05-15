/**
 * scripts/clasificar.js
 * Clasifica hallazgos existentes asignando tipo + relevancia.
 *
 * Uso:
 *   node --env-file=.env scripts/clasificar.js [--nicho=bomberos] [--dry-run]
 *
 * Tipos posibles:
 *   sentencia | anulacion | impugnacion | recurso | correccion_bases |
 *   suspension | medida_cautelar | psicotecnico | denuncia | noticia
 *
 * Relevancia:
 *   3 = señal jurídica verificable (BOE, sentencia, medida cautelar)
 *   2 = señal jurídica inferida (noticia con acción jurídica clara)
 *   1 = ruido / noticia genérica / foro
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_KEY;
const nichoArg     = process.argv.find(a => a.startsWith('--nicho='))?.split('=')[1] ?? 'bomberos';
const dryRun       = process.argv.includes('--dry-run');

// ── Reglas de clasificación (orden importa: más específico primero) ──────────

// Keywords que indican proceso de selección/oposición.
// Sólo se usan para filtrar sentencias de Google News (no BOE ni Google News legal,
// que ya son fuentes jurídicas específicas).
const KWS_OPOSICION = [
  'oposici', 'proceso selectivo', 'convocatoria', 'plaza', 'plazas',
  'aspirante', 'tribunal calificador', 'bases',
];

const REGLAS = [
  { tipo: 'medida_cautelar',  kws: ['medida cautelar'] },
  { tipo: 'psicotecnico',     kws: ['psicotécnico', 'psicotecnico', 'test de personalidad', 'test psicológico', 'prueba psicológica', 'prueba psicologica'] },
  { tipo: 'sentencia',        kws: ['sentencia', 'tsj ', 'tribunal superior de justicia', 'tribunal supremo', 'fallo judicial', 'casación', 'casacion', 'ecli'] },
  { tipo: 'anulacion',        kws: ['anulaci', 'nulidad', 'anuló', 'anulo ', 'declaró nulo', 'declaro nulo', 'anulado', 'anuladas', 'anulados'] },
  { tipo: 'impugnacion',      kws: ['impugnaci', 'impugn'] },
  { tipo: 'recurso',          kws: ['recurso contencioso', 'recurso de alzada', 'estimó el recurso', 'estimo el recurso', 'recurso administrativo', 'recurso de apelaci'] },
  { tipo: 'suspension',       kws: ['suspendi', 'suspensión', 'suspension', 'suspendido', 'suspendida'] },
  { tipo: 'correccion_bases', kws: ['rectificaci', 'corrección de errores', 'correccion de errores', 'error en las bases', 'corrección bases', 'correccion bases', 'bases corregidas'] },
];

function tieneContextoOposicion(texto) {
  return KWS_OPOSICION.some(kw => texto.includes(norm(kw)));
}

function norm(s) {
  return (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function clasificar(h) {
  const texto  = norm(`${h.titulo} ${h.descripcion ?? ''}`);
  const fuente = h.fuente ?? '';

  // ── Fuentes con relevancia fija ───────────────────────────────────────────
  if (fuente === 'BOE') {
    for (const { tipo, kws } of REGLAS) {
      if (kws.some(kw => texto.includes(norm(kw)))) return { tipo, relevancia: 3 };
    }
    return { tipo: 'correccion_bases', relevancia: 3 };
  }

  if (fuente === 'Google News (legal)') {
    for (const { tipo, kws } of REGLAS) {
      if (kws.some(kw => texto.includes(norm(kw)))) return { tipo, relevancia: 3 };
    }
    return { tipo: 'sentencia', relevancia: 3 };
  }

  if (fuente.startsWith('Reddit')) {
    return { tipo: 'denuncia', relevancia: 1 };
  }

  // ── Google News — clasificar por contenido ────────────────────────────────
  for (const { tipo, kws } of REGLAS) {
    if (!kws.some(kw => texto.includes(norm(kw)))) continue;
    // Para sentencia exigimos además contexto de oposición/proceso selectivo
    // para evitar sentencias sobre bomberos que no son de oposiciones.
    if (tipo === 'sentencia' && !tieneContextoOposicion(texto)) continue;
    const relevancia = tipo === 'medida_cautelar' ? 3 : 2;
    return { tipo, relevancia };
  }
  return { tipo: 'noticia', relevancia: 1 };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY en .env');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase
    .from('hallazgos')
    .select('id, fuente, titulo, descripcion')
    .eq('nicho', nichoArg)
    .is('tipo', null);

  if (error) { console.error('❌ Error leyendo BD:', error.message); process.exit(1); }

  console.log(`\n📋 ${data.length} hallazgos sin clasificar — nicho: "${nichoArg}"`);
  if (dryRun) console.log('   (dry-run — no se guarda nada)\n');
  else console.log();

  // Clasificar y agrupar por (tipo, relevancia) para hacer una query por grupo
  const grupos = {};
  for (const h of data) {
    const { tipo, relevancia } = clasificar(h);
    const key = `${tipo}::${relevancia}`;
    if (!grupos[key]) grupos[key] = { tipo, relevancia, ids: [] };
    grupos[key].ids.push(h.id);
  }

  // Mostrar distribución
  const sorted = Object.values(grupos).sort((a, b) => b.ids.length - a.ids.length);
  console.log('Distribución:');
  for (const { tipo, relevancia, ids } of sorted) {
    const bar = '█'.repeat(Math.round(ids.length / 3));
    console.log(`  [rel=${relevancia}] ${tipo.padEnd(18)} ${String(ids.length).padStart(4)}  ${bar}`);
  }

  const exportables = Object.values(grupos)
    .filter(g => g.relevancia >= 2)
    .reduce((sum, g) => sum + g.ids.length, 0);
  console.log(`\n  → ${exportables} exportables (relevancia ≥ 2) de ${data.length} total`);

  if (dryRun) {
    console.log('\n✅ Dry-run completado. Ejecuta sin --dry-run para aplicar.\n');
    return;
  }

  // Actualizar: una query por grupo
  let actualizados = 0;
  for (const { tipo, relevancia, ids } of sorted) {
    const { error: err } = await supabase
      .from('hallazgos')
      .update({ tipo, relevancia })
      .in('id', ids);
    if (err) {
      console.error(`  ❌ Error en tipo="${tipo}" rel=${relevancia}: ${err.message}`);
    } else {
      console.log(`  ✓ ${String(ids.length).padStart(4)} → tipo="${tipo}" rel=${relevancia}`);
      actualizados += ids.length;
    }
  }

  console.log(`\n✅ ${actualizados}/${data.length} hallazgos clasificados.\n`);
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
