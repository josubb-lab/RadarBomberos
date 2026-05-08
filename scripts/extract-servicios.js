/**
 * extract-servicios.js
 *
 * Extrae la lista de Servicios de Prevención y Extinción de Incendios (SPEIS)
 * y consorcios de bomberos en España usando:
 *   1. La API de Wikipedia (categoría + categorías de cada artículo)
 *   2. Un dataset curado de servicios adicionales conocidos
 *
 * Resultado → servicios_bomberos.json en la raíz del proyecto.
 *
 * Dependencias: npm install axios cheerio
 * Ejecución:    node scripts/extract-servicios.js
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = join(__dirname, "..", "servicios_bomberos.json");

const WIKI_API = "https://es.wikipedia.org/w/api.php";
const DELAY_MS = 300; // pausa entre peticiones para respetar la API

// ---------------------------------------------------------------------------
// Mapa de comunidades autónomas: palabras clave → nombre canónico
// ---------------------------------------------------------------------------
const CCAA_MAP = [
  { keys: ["andalucía", "andalucia", "sevilla", "málaga", "granada", "córdoba", "jaén", "almería", "cádiz", "huelva"], nombre: "Andalucía" },
  { keys: ["aragón", "aragon", "zaragoza", "huesca", "teruel"], nombre: "Aragón" },
  { keys: ["asturias", "principado de asturias"], nombre: "Asturias" },
  { keys: ["baleares", "illes balears", "mallorca", "menorca", "ibiza"], nombre: "Illes Balears" },
  { keys: ["canarias", "gran canaria", "tenerife", "lanzarote", "fuerteventura", "la palma"], nombre: "Canarias" },
  { keys: ["cantabria", "santander"], nombre: "Cantabria" },
  { keys: ["castilla-la mancha", "castilla la mancha", "albacete", "ciudad real", "cuenca", "guadalajara", "toledo"], nombre: "Castilla-La Mancha" },
  { keys: ["castilla y león", "castilla leon", "ávila", "burgos", "león", "palencia", "salamanca", "segovia", "soria", "valladolid", "zamora"], nombre: "Castilla y León" },
  { keys: ["cataluña", "catalunya", "barcelona", "girona", "lleida", "tarragona", "generalitat de cataluña", "generalidad de cataluña"], nombre: "Cataluña" },
  { keys: ["ceuta"], nombre: "Ceuta" },
  { keys: ["extremadura", "badajoz", "cáceres"], nombre: "Extremadura" },
  { keys: ["galicia", "a coruña", "lugo", "ourense", "pontevedra", "xunta"], nombre: "Galicia" },
  { keys: ["la rioja", "rioja"], nombre: "La Rioja" },
  { keys: ["madrid", "comunidad de madrid"], nombre: "Comunidad de Madrid" },
  { keys: ["melilla"], nombre: "Melilla" },
  { keys: ["murcia", "región de murcia"], nombre: "Región de Murcia" },
  { keys: ["navarra", "nafarroa"], nombre: "Navarra" },
  { keys: ["país vasco", "euskadi", "bizkaia", "gipuzkoa", "álava", "bilbao", "donostia", "vitoria"], nombre: "País Vasco" },
  { keys: ["comunitat valenciana", "comunidad valenciana", "valencia", "alicante", "castellón"], nombre: "Comunitat Valenciana" },
];

function inferComunidad(texto) {
  const t = texto.toLowerCase();
  for (const { keys, nombre } of CCAA_MAP) {
    if (keys.some((k) => t.includes(k))) return nombre;
  }
  return "Desconocida";
}

function inferTipo(texto) {
  const t = texto.toLowerCase();
  if (t.includes("consorcio")) return "Consorcio";
  if (t.includes("municipal") || t.includes("ayuntamiento") || t.includes("bomberos de ") && !t.includes("generalitat") && !t.includes("comunidad") && !t.includes("principado")) return "Municipal";
  if (
    t.includes("generalitat") ||
    t.includes("generalidad") ||
    t.includes("comunidad de") ||
    t.includes("comunitat") ||
    t.includes("principado") ||
    t.includes("xunta") ||
    t.includes("junta de") ||
    t.includes("gobierno de") ||
    t.includes("región de") ||
    t.includes("diputación")
  ) return "Autonómico";
  return "Otros";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiGet(params) {
  const { data } = await axios.get(WIKI_API, {
    params: { format: "json", ...params },
    headers: { "User-Agent": "web_radar-scraper/1.0 (educational project)" },
    timeout: 15_000,
  });
  return data;
}

// ---------------------------------------------------------------------------
// 1. Obtener todos los miembros de la categoría (incluyendo subcategorías)
// ---------------------------------------------------------------------------
async function getCategoryMembers(category, depth = 1) {
  const titles = new Set();
  const queue = [category];

  for (let d = 0; d <= depth && queue.length; d++) {
    const current = [...queue];
    queue.length = 0;

    for (const cat of current) {
      let cmcontinue;
      do {
        const params = {
          action: "query",
          list: "categorymembers",
          cmtitle: cat,
          cmlimit: 500,
          cmtype: d < depth ? "page|subcat" : "page",
        };
        if (cmcontinue) params.cmcontinue = cmcontinue;

        const data = await apiGet(params);
        const members = data?.query?.categorymembers ?? [];

        for (const m of members) {
          if (m.ns === 0) titles.add(m.title);        // artículo
          if (m.ns === 14 && d < depth) queue.push(m.title); // subcategoría
        }

        cmcontinue = data?.continue?.cmcontinue;
      } while (cmcontinue);

      await sleep(DELAY_MS);
    }
  }
  return [...titles];
}

// ---------------------------------------------------------------------------
// 2. Obtener categorías de un artículo para inferir CCAA y tipo
// ---------------------------------------------------------------------------
async function getPageCategories(title) {
  const data = await apiGet({
    action: "query",
    prop: "categories",
    titles: title,
    cllimit: 50,
  });
  const pages = Object.values(data?.query?.pages ?? {});
  return (pages[0]?.categories ?? []).map((c) => c.title);
}

// ---------------------------------------------------------------------------
// 3. Dataset curado de servicios bien conocidos (complemento al scraping)
// ---------------------------------------------------------------------------
const DATASET_CURADO = [
  { nombre: "Bomberos de la Generalidad de Cataluña (Bombers de la Generalitat)", tipo: "Autonómico", comunidad: "Cataluña" },
  { nombre: "Cuerpo de Bomberos de la Comunidad de Madrid", tipo: "Autonómico", comunidad: "Comunidad de Madrid" },
  { nombre: "Servicio de Emergencias del Principado de Asturias (SEPA)", tipo: "Autonómico", comunidad: "Asturias" },
  { nombre: "Servicio de Prevención y Extinción de Incendios de Navarra", tipo: "Autonómico", comunidad: "Navarra" },
  { nombre: "Bomberos Foral de Navarra", tipo: "Autonómico", comunidad: "Navarra" },
  { nombre: "Consorcio de Extinción de Incendios y Salvamento de la Región de Murcia (CEIS Murcia)", tipo: "Consorcio", comunidad: "Región de Murcia" },
  { nombre: "Consorcio de Emergencias de Gran Canaria", tipo: "Consorcio", comunidad: "Canarias" },
  { nombre: "Consorcio Provincial de Bomberos de Valencia", tipo: "Consorcio", comunidad: "Comunitat Valenciana" },
  { nombre: "Consorcio Provincial de Bomberos de Alicante", tipo: "Consorcio", comunidad: "Comunitat Valenciana" },
  { nombre: "Consorcio Provincial de Bomberos de Castellón", tipo: "Consorcio", comunidad: "Comunitat Valenciana" },
  { nombre: "Consorcio de Extinción de Incendios de la Diputación de Jaén", tipo: "Consorcio", comunidad: "Andalucía" },
  { nombre: "Servicio de Prevención, Extinción de Incendios y Salvamento de Sevilla (SPEIS Sevilla)", tipo: "Municipal", comunidad: "Andalucía" },
  { nombre: "Servicio de Extinción de Incendios y Salvamento de Málaga (SEIS)", tipo: "Municipal", comunidad: "Andalucía" },
  { nombre: "Servicio de Extinción de Incendios y Salvamento de Córdoba", tipo: "Municipal", comunidad: "Andalucía" },
  { nombre: "Servicio de Extinción de Incendios y Salvamento de Granada", tipo: "Municipal", comunidad: "Andalucía" },
  { nombre: "Servicio de Extinción de Incendios de Almería", tipo: "Municipal", comunidad: "Andalucía" },
  { nombre: "Bomberos de Barcelona", tipo: "Municipal", comunidad: "Cataluña" },
  { nombre: "Servicio de Prevención, Extinción de Incendios y Salvamento de Madrid (SPEIS Madrid)", tipo: "Municipal", comunidad: "Comunidad de Madrid" },
  { nombre: "Bomberos del Ayuntamiento de Zaragoza", tipo: "Municipal", comunidad: "Aragón" },
  { nombre: "Bomberos del Ayuntamiento de Bilbao", tipo: "Municipal", comunidad: "País Vasco" },
  { nombre: "Bomberos del Ayuntamiento de Vitoria-Gasteiz", tipo: "Municipal", comunidad: "País Vasco" },
  { nombre: "Bomberos del Ayuntamiento de Donostia-San Sebastián", tipo: "Municipal", comunidad: "País Vasco" },
  { nombre: "Bomberos del Ayuntamiento de Valladolid", tipo: "Municipal", comunidad: "Castilla y León" },
  { nombre: "Bomberos de la Diputación de Valladolid", tipo: "Autonómico", comunidad: "Castilla y León" },
  { nombre: "Bomberos del Ayuntamiento de Burgos", tipo: "Municipal", comunidad: "Castilla y León" },
  { nombre: "Servicio de Extinción de Incendios y Salvamento de Salamanca", tipo: "Municipal", comunidad: "Castilla y León" },
  { nombre: "Bomberos del Ayuntamiento de Palencia", tipo: "Municipal", comunidad: "Castilla y León" },
  { nombre: "Bomberos del Ayuntamiento de Segovia", tipo: "Municipal", comunidad: "Castilla y León" },
  { nombre: "Bomberos del Ayuntamiento de Ávila", tipo: "Municipal", comunidad: "Castilla y León" },
  { nombre: "Bomberos del Ayuntamiento de Zamora", tipo: "Municipal", comunidad: "Castilla y León" },
  { nombre: "Servicio Extinción de Incendios de Albacete (SPEIS)", tipo: "Municipal", comunidad: "Castilla-La Mancha" },
  { nombre: "Bomberos del Ayuntamiento de Toledo", tipo: "Municipal", comunidad: "Castilla-La Mancha" },
  { nombre: "Bomberos del Ayuntamiento de Ciudad Real", tipo: "Municipal", comunidad: "Castilla-La Mancha" },
  { nombre: "Bomberos del Ayuntamiento de Guadalajara", tipo: "Municipal", comunidad: "Castilla-La Mancha" },
  { nombre: "Bomberos del Ayuntamiento de Cuenca", tipo: "Municipal", comunidad: "Castilla-La Mancha" },
  { nombre: "Bomberos del Ayuntamiento de Cáceres", tipo: "Municipal", comunidad: "Extremadura" },
  { nombre: "Bomberos del Ayuntamiento de Badajoz", tipo: "Municipal", comunidad: "Extremadura" },
  { nombre: "Bomberos de A Coruña", tipo: "Municipal", comunidad: "Galicia" },
  { nombre: "Bomberos de Pontevedra", tipo: "Municipal", comunidad: "Galicia" },
  { nombre: "Bomberos de Lugo", tipo: "Municipal", comunidad: "Galicia" },
  { nombre: "Bomberos de Ourense", tipo: "Municipal", comunidad: "Galicia" },
  { nombre: "Bomberos del Ayuntamiento de Logroño", tipo: "Municipal", comunidad: "La Rioja" },
  { nombre: "Bomberos de Palma de Mallorca", tipo: "Municipal", comunidad: "Illes Balears" },
  { nombre: "Bomberos del Ayuntamiento de Pamplona", tipo: "Municipal", comunidad: "Navarra" },
  { nombre: "Bomberos del Ayuntamiento de Santander", tipo: "Municipal", comunidad: "Cantabria" },
  { nombre: "Real Cuerpo de Bomberos Voluntarios de Santander", tipo: "Otros", comunidad: "Cantabria" },
  { nombre: "Bomberos del Ayuntamiento de Las Palmas de Gran Canaria", tipo: "Municipal", comunidad: "Canarias" },
  { nombre: "Servicio de Extinción de Incendios y Salvamento de Las Palmas de Gran Canaria", tipo: "Municipal", comunidad: "Canarias" },
  { nombre: "Bomberos del Ayuntamiento de Santa Cruz de Tenerife", tipo: "Municipal", comunidad: "Canarias" },
  { nombre: "Servicio Contra Incendios y Salvamento de Murcia (SEIS Murcia)", tipo: "Municipal", comunidad: "Región de Murcia" },
  { nombre: "Bomberos del Ayuntamiento de Cartagena", tipo: "Municipal", comunidad: "Región de Murcia" },
  { nombre: "Brigadas de Refuerzo de Incendios Forestales (BRIF)", tipo: "Autonómico", comunidad: "España (nacional)" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== Extractor de SPEIS / Consorcios de Bomberos en España ===\n");

  // ── Paso 1: artículos de Wikipedia vía API ─────────────────────────────
  console.log("📡 Consultando la API de Wikipedia...");
  let wikiTitles = [];
  try {
    wikiTitles = await getCategoryMembers(
      "Categoría:Cuerpos de bomberos de España",
      1
    );
    console.log(`   → ${wikiTitles.length} artículos encontrados en la categoría.\n`);
  } catch (err) {
    console.warn(`   ⚠ No se pudo acceder a la API: ${err.message}. Usando solo dataset curado.\n`);
  }

  // ── Paso 2: enriquecer cada artículo con sus categorías ────────────────
  const wikiServicios = [];
  for (const title of wikiTitles) {
    try {
      const cats = await getPageCategories(title);
      const catText = cats.join(" ").toLowerCase();
      const allText = `${title} ${catText}`;

      wikiServicios.push({
        nombre: title,
        tipo: inferTipo(title),
        comunidad: inferComunidad(allText),
      });

      process.stdout.write(`   ✓ ${title}\n`);
      await sleep(DELAY_MS);
    } catch (err) {
      console.warn(`   ⚠ Error con "${title}": ${err.message}`);
    }
  }

  // ── Paso 3: combinar Wikipedia + dataset curado ────────────────────────
  const todos = [...wikiServicios, ...DATASET_CURADO];

  // Deduplicar por nombre (normalizado)
  const seen = new Set();
  const unique = todos.filter(({ nombre }) => {
    const key = nombre.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordenar por comunidad y luego por nombre
  unique.sort((a, b) =>
    a.comunidad.localeCompare(b.comunidad, "es") ||
    a.nombre.localeCompare(b.nombre, "es")
  );

  // ── Paso 4: guardar JSON ───────────────────────────────────────────────
  writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2), "utf-8");

  console.log(`\n✅ Total de servicios extraídos: ${unique.length}`);
  console.log(`✅ Archivo guardado en: ${OUTPUT_FILE}\n`);

  // Resumen por comunidad
  const porComunidad = {};
  for (const s of unique) {
    porComunidad[s.comunidad] = (porComunidad[s.comunidad] ?? 0) + 1;
  }
  console.log("Resumen por comunidad autónoma:");
  for (const [ccaa, count] of Object.entries(porComunidad).sort()) {
    console.log(`  ${ccaa.padEnd(30)} ${count} servicio(s)`);
  }

  console.log("\nVista previa (primeros 5 registros):");
  console.table(unique.slice(0, 5));

  // ── Paso 5: upsert a Supabase ──────────────────────────────────────────
  // Usa onConflict:'nombre' → nunca genera duplicados aunque el script se
  // ejecute múltiples veces. Requiere la UNIQUE constraint en la columna:
  //   ALTER TABLE servicios_bomberos
  //     ADD CONSTRAINT servicios_bomberos_nombre_unique UNIQUE (nombre);
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "\n⚠️  Variables PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY no encontradas." +
      "\n   El JSON local se ha guardado pero NO se ha sincronizado con Supabase." +
      "\n   Ejecuta con: node --env-file=.env scripts/extract-servicios.js"
    );
    return;
  }

  console.log("\n📡 Sincronizando con Supabase (upsert)…");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Lote de máximo 500 filas por llamada (límite de PostgREST)
  const BATCH = 500;
  let insertados = 0;
  let errores = 0;

  for (let i = 0; i < unique.length; i += BATCH) {
    const lote = unique.slice(i, i + BATCH);
    const { error } = await supabase
      .from("servicios_bomberos")
      .upsert(lote, { onConflict: "nombre", ignoreDuplicates: false });

    if (error) {
      console.error(`   ❌ Error en lote ${i}–${i + lote.length}: ${error.message}`);
      errores += lote.length;
    } else {
      insertados += lote.length;
      console.log(`   ✓ Lote ${i + 1}–${i + lote.length} sincronizado.`);
    }
  }

  console.log(`\n✅ Supabase actualizado: ${insertados} upserts OK, ${errores} con error.`);
}

main().catch((err) => {
  console.error("\n❌ Error fatal:", err.message);
  process.exit(1);
});
