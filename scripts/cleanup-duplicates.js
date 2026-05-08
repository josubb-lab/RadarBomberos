/**
 * scripts/cleanup-duplicates.js
 * Elimina de Supabase los registros duplicados que quedaron de ejecuciones
 * anteriores. Ejecutar una sola vez tras limpiar servicios_bomberos.json.
 *
 * node --env-file=.env scripts/cleanup-duplicates.js
 */

import { createClient } from "@supabase/supabase-js";

const DUPLICADOS = [
  "Servicio de Emergencias del Principado de Asturias",
  "Bomberos del Ayuntamiento de Las Palmas de Gran Canaria",
  "Bomberos de Valladolid",
  "Bomberos Albacete",
  "Servicios Especiales y de Prevención y Extinción de Incendios de Albacete",
  "Bomberos de la Generalidad de Cataluña",
  "Brigadas de Refuerzo de Incendios Forestales",
];

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_KEY,
);

for (const nombre of DUPLICADOS) {
  const { error } = await supabase
    .from("servicios_bomberos")
    .delete()
    .eq("nombre", nombre);

  if (error) {
    console.error(`❌ Error borrando "${nombre}": ${error.message}`);
  } else {
    console.log(`✅ Eliminado: "${nombre}"`);
  }
}

console.log("\nLimpieza completada.");
