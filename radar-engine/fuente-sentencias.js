/**
 * fuente-sentencias.js
 * Google News RSS — queries legales (sentencias, TSJ, contencioso).
 *
 * CENDOJ dejó de devolver resultados scrapeables (500 / página de formulario).
 * DuckDuckGo HTML detecta bots (202 sin resultados parseables).
 * Se usa Google News RSS con queries específicas de contenido judicial.
 */

import Parser from "rss-parser";

const PUNTOS_SENTENCIA = 40;
const DELAY_MS         = 1_400;

const KEYWORDS_NEG = [
  "anulaci", "nulidad", "impugnaci", "condena",
  "discriminaci", "arbitrariedad", "vulneraci",
  "recurso estimado", "fallo contrario",
];

const KEYWORDS_LEGAL = [
  "sentencia", "tsj", "tribunal superior", "tribunal supremo",
  "contencioso", "juzgado", "fallo", "resolución judicial",
  "anuló", "declaró nulo", "estimó el recurso", "casación",
];

const sleep      = (ms) => new Promise((r) => setTimeout(r, ms));
const esNegativo = (t)  => KEYWORDS_NEG.some((kw)   => t.toLowerCase().includes(kw));
const esLegal    = (t)  => KEYWORDS_LEGAL.some((kw) => t.toLowerCase().includes(kw));

const rssParser = new Parser({
  timeout: 15_000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
});

const CACHE = new Map();

async function buscarEnGoogle(query) {
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
    const msg = err.message || err.code || String(err);
    console.warn(`[Sentencias] Error («${query.slice(0, 60)}»): ${msg}`);
    CACHE.set(query, []);
    return [];
  }
}

export async function analizarSentencias(config) {
  const hallazgos = [];

  // Cada query del nicho se enriquece con términos judiciales
  const queries = config.queriesCENDOJ.map(
    (q) => `${q} sentencia OR TSJ OR "tribunal supremo" OR contencioso`
  );

  for (const query of queries) {
    const items = await buscarEnGoogle(query);

    for (const item of items) {
      const titulo  = item.title         ?? "";
      const resumen = item.contentSnippet ?? item.content ?? "";
      const texto   = `${titulo} ${resumen}`;
      const url     = item.link ?? "";
      const fecha   = item.pubDate ?? item.isoDate ?? "";

      if (!url) continue;
      if (!esNegativo(texto) && !esLegal(texto)) continue;

      hallazgos.push({
        fuente:      "Google News (legal)",
        tipo:        "sentencia_negativa",
        titulo,
        descripcion: resumen.slice(0, 300),
        fecha,
        url,
        puntos:      PUNTOS_SENTENCIA,
      });
    }

    console.log(`[Sentencias] «${query.slice(0, 70)}» → ${items.length} items`);
  }

  const seen = new Set();
  return hallazgos.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
