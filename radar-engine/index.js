/**
 * radar-engine/index.js
 * Orquestador — lanza las 4 fuentes y guarda hallazgos en Supabase.
 *
 * Uso:
 *   node --env-file=.env radar-engine/index.js --nicho=bomberos
 *   node --env-file=.env radar-engine/index.js --nicho=policia-local --fuente=noticias
 *
 * Nichos disponibles: bomberos | policia-local | policia-nacional | docentes | correos
 * Fuentes disponibles: noticias | boletines | sentencias | foros  (sin argumento = todas)
 */

import { createClient }       from "@supabase/supabase-js";
import { analizarBoletines }  from "./fuente-boletines.js";
import { analizarSentencias } from "./fuente-sentencias.js";
import { analizarForos }      from "./fuente-foros.js";
import { analizarNoticias }   from "./fuente-noticias.js";

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_KEY;

const nichoArg  = process.argv.find((a) => a.startsWith("--nicho="))?.split("=")[1]  ?? "bomberos";
const fuenteArg = process.argv.find((a) => a.startsWith("--fuente="))?.split("=")[1];

const NICHOS_DISPONIBLES = ["bomberos", "policia-local", "policia-nacional", "docentes", "correos"];

function normalizarFecha(fechaStr) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  RADAR ENGINE — nicho: ${nichoArg}${fuenteArg ? `  fuente: ${fuenteArg}` : ""}`);
  console.log(`  ${new Date().toLocaleString("es-ES")}`);
  console.log("══════════════════════════════════════════════════════════\n");

  if (!NICHOS_DISPONIBLES.includes(nichoArg)) {
    console.error(`❌ Nicho desconocido: "${nichoArg}". Disponibles: ${NICHOS_DISPONIBLES.join(", ")}`);
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY en .env");
    process.exit(1);
  }

  // Cargar config del nicho dinámicamente
  const { default: nichoConfig } = await import(`./nichos/${nichoArg}.js`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Obtener URLs ya guardadas para este nicho (deduplicar)
  const { data: existentes } = await supabase
    .from("hallazgos")
    .select("url")
    .eq("nicho", nichoArg);
  const urlsExistentes = new Set((existentes ?? []).map((r) => r.url));
  console.log(`📋 ${urlsExistentes.size} hallazgos ya en BD para "${nichoArg}".\n`);

  const fuentes = {
    noticias:   () => analizarNoticias(nichoConfig),
    boletines:  () => analizarBoletines(nichoConfig),
    sentencias: () => analizarSentencias(nichoConfig),
    foros:      () => analizarForos(nichoConfig),
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

    const nuevos  = hallazgos.filter((h) => h.url && !urlsExistentes.has(h.url));
    const elapsed = ((Date.now() - inicio) / 1000).toFixed(1);

    console.log(`   ✓ ${hallazgos.length} encontrados | ${nuevos.length} nuevos | ${elapsed}s`);

    if (nuevos.length > 0) {
      console.log("   Desglose:");
      for (const h of nuevos) {
        console.log(`     [${h.fuente}] ${h.tipo}  → ${h.titulo?.slice(0, 70)}`);
      }

      const rows = nuevos.map((h) => ({
        nicho:       nichoArg,
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
  console.log(`  RESUMEN [${nichoArg}]: ${totalNuevos} hallazgos nuevos guardados`);
  console.log("══════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Error fatal:", err.message);
  process.exit(1);
});
