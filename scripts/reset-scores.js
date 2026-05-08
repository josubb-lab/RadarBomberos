/**
 * reset-scores.js  –  Pizarra limpia antes de una nueva pasada del radar.
 * Pone puntuacion_transparencia = 100 y conflictividad_index = 0 en todos los registros.
 *
 * Ejecución: node --env-file=.env scripts/reset-scores.js
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY,
);

const { count: total } = await supabase
  .from("servicios_bomberos")
  .select("id", { count: "exact", head: true });

console.log(`\n🔄 Reseteando ${total} registros en servicios_bomberos…`);

const { error } = await supabase
  .from("servicios_bomberos")
  .update({ puntuacion_transparencia: 100, conflictividad_index: 0 })
  .gte("puntuacion_transparencia", 0); // filtro requerido; aplica a todos

if (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}

const { count: verificacion } = await supabase
  .from("servicios_bomberos")
  .select("id", { count: "exact", head: true })
  .eq("conflictividad_index", 0);

console.log(`✅ Reset completado. Filas con conflictividad_index = 0: ${verificacion} / ${total}\n`);
