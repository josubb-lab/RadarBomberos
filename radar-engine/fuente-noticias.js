/**
 * fuente-noticias.js
 * Google News RSS — queries generales + por comunidad autónoma y ciudad.
 */

import Parser from "rss-parser";

const PUNTOS_NOTICIA = 15;
const MAX_DIAS       = 730;
const DELAY_MS       = 1_400;

const COMUNIDADES = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria',
  'Castilla La Mancha', 'Castilla y León', 'Cataluña', 'Comunidad Valenciana',
  'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 'País Vasco',
];

const CIUDADES = [
  'Sevilla', 'Málaga', 'Granada', 'Córdoba', 'Almería', 'Cádiz', 'Huelva', 'Jaén',
  'Zaragoza', 'Oviedo', 'Palma', 'Las Palmas', 'Tenerife', 'Santander',
  'Toledo', 'Albacete', 'Ciudad Real', 'Cuenca',
  'Burgos', 'León', 'Salamanca', 'Valladolid', 'Zamora',
  'Barcelona', 'Tarragona', 'Lleida', 'Girona',
  'Valencia', 'Alicante', 'Castellón',
  'Badajoz', 'Cáceres',
  'A Coruña', 'Vigo', 'Pontevedra', 'Lugo',
  'Logroño', 'Murcia', 'Pamplona', 'Bilbao', 'Vitoria', 'San Sebastián',
  'Ceuta', 'Melilla',
];

const QUERIES_GENERALES = [
  'oposición bomberos (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)',
  'oposiciones bombero (discriminación OR nepotismo OR enchufe OR amiguismo)',
  'SPEIS oposición (anulación OR irregularidad OR escándalo OR recurso)',
  'bomberos convocatoria (nulidad OR suspensión OR impugna OR corrupción)',
  'opositor bombero (trampa OR tongo OR favoritismo OR injusticia)',
  'bombero proceso selectivo (ilegal OR anulado OR suspendido OR impugnado)',
  'bomberos tribunal selección (irregular OR denunciado OR recurrido OR cuestionado)',
  'oposición bombero discriminación pruebas físicas sexo',
  'bomberos cupo reserva convocatoria irregularidad',
  'convocatoria bombero bases impugnadas recurso contencioso',
  'SPEIS plaza convocatoria escándalo fraude enchufe',
  'bombero oposición nepotismo enchufismo contactos selectivo',
  'sentencia bomberos proceso selectivo nulidad impugnación',
];

const QUERIES_COMUNIDADES = COMUNIDADES.flatMap(c => [
  `bomberos ${c} (impugnación OR fraude OR irregularidad OR nulidad OR denuncia)`,
  `oposición bombero ${c} (recurso OR escándalo OR anulación OR enchufe OR irregular)`,
]);

const QUERIES_CIUDADES = CIUDADES.map(c =>
  `bomberos ${c} oposición (impugnación OR fraude OR irregularidad OR denuncia OR anulación)`
);

const QUERIES = [
  ...QUERIES_GENERALES,
  ...QUERIES_COMUNIDADES,
  ...QUERIES_CIUDADES,
];

const STOP_WORDS = [
  "atropello", "asesinato", "homicidio", "dana", "inundacion",
  "investidura", "gobierno de", "partido político", "congreso de los diputados",
  "accidente de tráfico", "incendio en una vivienda", "incendio en un piso",
  "muerto en un incendio", "fallecido en un incendio", "narcotráfico",
  "terremoto", "erupción", "tornado", "temporal de",
  // Latinoamérica
  "medellín", "itagüí", "bogotá", "colombia", "méxico", "argentina",
  "chile", "peru", "venezuela", "ecuador", "costa rica", "chile",
  "area metropolitana de medellin",
];

const TOPIC_KEYWORDS = [
  "oposicion", "oposiciones", "convocatoria", "plaza de bombero", "plazas de bombero",
  "proceso selectivo", "bases de la convocatoria", "pruebas selectivas",
  "bombero", "bomberos", "servicio de extincion", "speis", "parque de bomberos",
];

const NEGATIVE_KEYWORDS = [
  "impugnacion", "impugna", "irregularidad", "fraude", "corrupcion",
  "denuncia", "discriminacion", "nepotismo", "enchufe", "favoritismo",
  "amiguismo", "nulidad", "anulacion", "ilegalidad", "recurso de alzada",
  "sentencia", "trampa", "tongo", "ilegal", "escandalo", "enchufismo",
  "arbitrariedad", "recurso contencioso", "injusticia", "favorecer",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizar(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const tieneStopWord     = (t) => STOP_WORDS.some((sw) => normalizar(t).includes(normalizar(sw)));
const esSobreOposicion  = (t) => TOPIC_KEYWORDS.some((kw) => normalizar(t).includes(normalizar(kw)));
const tieneSeñalNegativa = (t) => NEGATIVE_KEYWORDS.some((kw) => normalizar(t).includes(normalizar(kw)));

function esReciente(fechaStr) {
  if (!fechaStr) return true;
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return true;
  return (Date.now() - d.getTime()) / 86_400_000 <= MAX_DIAS;
}

const rssParser = new Parser({
  timeout: 15_000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
});

const CACHE = new Map();

async function fetchGoogleNews(query) {
  if (CACHE.has(query)) return CACHE.get(query);
  const url = "https://news.google.com/rss/search?" +
    new URLSearchParams({ q: query, hl: "es", gl: "ES", ceid: "ES:es" });
  try {
    const feed  = await rssParser.parseURL(url);
    const items = feed.items ?? [];
    CACHE.set(query, items);
    await sleep(DELAY_MS);
    return items;
  } catch (err) {
    console.warn(`[Noticias] Error («${query.slice(0, 60)}»): ${err.message}`);
    CACHE.set(query, []);
    return [];
  }
}

export async function analizarNoticias() {
  const hallazgos = [];
  let queried = 0;

  for (const query of QUERIES) {
    queried++;
    if (queried % 20 === 0) {
      console.log(`[Noticias] ${queried}/${QUERIES.length} queries lanzadas, ${hallazgos.length} hallazgos hasta ahora...`);
    }

    const items = await fetchGoogleNews(query);

    for (const item of items) {
      const titulo  = item.title         ?? "";
      const resumen = item.contentSnippet ?? item.content ?? "";
      const texto   = `${titulo} ${resumen}`;
      const fecha   = item.pubDate ?? item.isoDate ?? "";
      const url     = item.link ?? "";

      if (!url)                          continue;
      if (!esReciente(fecha))            continue;
      if (tieneStopWord(texto))          continue;
      if (!esSobreOposicion(texto))      continue;
      if (!tieneSeñalNegativa(texto))    continue;

      hallazgos.push({
        fuente:      "Google News",
        tipo:        "noticia_negativa",
        titulo,
        descripcion: resumen.slice(0, 300),
        fecha,
        url,
        puntos:      PUNTOS_NOTICIA,
      });
    }
  }

  const seen = new Set();
  return hallazgos.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
