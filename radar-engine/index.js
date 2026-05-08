/**
 * radar-engine/index.js
 * Orquestador — lanza las 4 fuentes y guarda hallazgos en Supabase.
 *
 * Uso:
 *   node --env-file=.env radar-engine/index.js              (todas las fuentes)
 *   node --env-file=.env radar-engine/index.js --fuente=noticias
 *   node --env-file=.env radar-engine/index.js --fuente=boletines
 *   node --env-file=.env radar-engine/index.js --fuente=sentencias
 *   node --env-file=.env radar-engine/index.js --fuente=foros
 */

import { createClient }       from "@supabase/supabase-js";
import { analizarBoletines }  from "./fuente-boletines.js";
import { analizarSentencias } from "./fuente-sentencias.js";
import { analizarForos }      from "./fuente-foros.js";
import { analizarNoticias }   from "./fuente-noticias.js";

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_KEY;

// Argumento opcional --fuente=<nombre>
const fuenteArg = process.argv.find((a) => a.startsWith("--fuente="))?.split("=")[1];

function normalizarFecha(fechaStr) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("══════════════════════════════════════════════════════════");
  console.log("  RADAR ENGINE – Señales negativas en oposiciones bombero");
  console.log(`  ${new Date().toLocaleString("es-ES")}${fuenteArg ? `  [fuente: ${fuenteArg}]` : ""}`);
  console.log("══════════════════════════════════════════════════════════\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY en .env");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Obtener URLs ya guardadas para deduplicar ─────────────────────────────
  const { data: existentes } = await supabase.from("hallazgos").select("url");
  const urlsExistentes = new Set((existentes ?? []).map((r) => r.url));
  console.log(`📋 ${urlsExistentes.size} hallazgos ya en BD.\n`);

  // ── Lanzar fuentes ────────────────────────────────────────────────────────
  const fuentes = {
    noticias:   analizarNoticias,
    boletines:  analizarBoletines,
    sentencias: analizarSentencias,
    foros:      analizarForos,
  };

  const fuentesAEjecutar = fuenteArg
    ? { [fuenteArg]: fuentes[fuenteArg] }
    : fuentes;

  if (fuenteArg && !fuentes[fuenteArg]) {
    console.error(`❌ Fuente desconocida: "${fuenteArg}". Usa: noticias, boletines, sentencias, foros`);
    process.exit(1);
  }

  let totalNuevos = 0;

  for (const [nombre, fn] of Object.entries(fuentesAEjecutar)) {
    console.log(`\n🔍 Analizando fuente: ${nombre}`);
    const inicio = Date.now();

    let hallazgos = [];
    try {
      hallazgos = await fn();
    } catch (err) {
      console.error(`   ❌ Error en ${nombre}: ${err.message}`);
      continue;
    }

    // Filtrar los ya existentes en BD
    const nuevos = hallazgos.filter((h) => h.url && !urlsExistentes.has(h.url));
    const elapsed = ((Date.now() - inicio) / 1000).toFixed(1);

    console.log(`   ✓ ${hallazgos.length} encontrados | ${nuevos.length} nuevos | ${elapsed}s`);

    if (nuevos.length > 0) {
      console.log("   Desglose:");
      for (const h of nuevos) {
        console.log(`     [${h.fuente}] ${h.tipo}  → ${h.titulo?.slice(0, 70)}`);
      }

      const rows = nuevos.map((h) => ({
        fuente:      h.fuente,
        titulo:      h.titulo      ?? "(sin título)",
        descripcion: h.descripcion ?? null,
        fecha:       normalizarFecha(h.fecha),
        url:         h.url,
      }));

      const { error } = await supabase.from("hallazgos").insert(rows);
      if (error) {
        console.error(`   ❌ Error insertando en BD: ${error.message}`);
      } else {
        console.log(`   ✅ ${rows.length} hallazgo${rows.length !== 1 ? "s" : ""} guardado${rows.length !== 1 ? "s" : ""} en BD`);
        rows.forEach((r) => urlsExistentes.add(r.url));
        totalNuevos += rows.length;
      }
    }
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  RESUMEN: ${totalNuevos} hallazgos nuevos guardados en BD`);
  console.log("══════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Error fatal:", err.message);
  process.exit(1);
});
