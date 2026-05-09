/**
 * fuente-sentencias.js
 * CENDOJ + DuckDuckGo — parametrizado por nicho.
 */

import axios    from "axios";
import * as cheerio from "cheerio";

const CENDOJ_SEARCH    = "https://www.poderjudicial.es/search/indexAN.jsp";
const DDG_HTML         = "https://html.duckduckgo.com/html/";
const DELAY_MS         = 1_500;
const PUNTOS_SENTENCIA = 60;

const HEADERS_CHROME = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const KEYWORDS_NEG = [
  "anulaci", "nulidad", "impugnaci", "condena",
  "discriminaci", "arbitrariedad", "vulneraci",
  "recurso contencioso", "recurso estimado",
];

const sleep      = (ms) => new Promise((r) => setTimeout(r, ms));
const esNegativo = (t) => KEYWORDS_NEG.some((kw) => t.toLowerCase().includes(kw));

let cendojBloqueado = false;
const DDG_CACHE = new Map();

async function consultarCENDOJ(query) {
  if (cendojBloqueado) return [];
  try {
    const { data: html } = await axios.get(CENDOJ_SEARCH, {
      params:  { org: "an", municipality: "0", rango: "0", ctype: "Sentencia", query },
      headers: HEADERS_CHROME,
      timeout: 12_000,
    });

    const $          = cheerio.load(html);
    const resultados = [];

    $("tr.resultado, div.resultado, .search-result, table tr").slice(1).each((_i, el) => {
      const titulo  = $(el).find("a, .titulo, h3, td:first-child a").first().text().trim();
      const enlace  = $(el).find("a").first().attr("href") ?? "";
      const resumen = $(el).find("p, .resumen, td:last-child").first().text().trim();
      if (titulo) resultados.push({
        titulo, resumen,
        url: enlace.startsWith("http") ? enlace : `https://www.poderjudicial.es${enlace}`,
      });
    });

    return resultados;
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 429) {
      console.warn(`[Sentencias] CENDOJ bloqueado. Activando DuckDuckGo.`);
      cendojBloqueado = true;
    } else {
      console.warn(`[Sentencias] Error CENDOJ («${query.slice(0, 50)}»): ${err.message}`);
    }
    return [];
  }
}

async function buscarEnDDG(query) {
  if (DDG_CACHE.has(query)) return DDG_CACHE.get(query);

  const resultados = [];
  try {
    const { data: html } = await axios.post(
      DDG_HTML,
      new URLSearchParams({ q: query, b: "", kl: "es-es" }).toString(),
      {
        headers: {
          ...HEADERS_CHROME,
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://duckduckgo.com/",
        },
        timeout: 6_000,
      },
    );

    const $ = cheerio.load(html);
    $(".result, .links_main, .web-result").each((_i, el) => {
      const titulo  = $(el).find(".result__title, .result__a, h2 a").first().text().trim();
      const urlText = $(el).find(".result__url, .result__extras__url").first().text().trim();
      const snippet = $(el).find(".result__snippet, .result__body").first().text().trim();
      const rawHref = $(el).find("a.result__a, a[href*='poderjudicial']").first().attr("href") ?? "";

      const url = urlText.includes("poderjudicial.es")
        ? `https://${urlText.replace(/^\/\//, "").trim()}`
        : rawHref.includes("poderjudicial.es") ? rawHref : "";

      if (url && titulo) resultados.push({ titulo, url, resumen: snippet });
    });

    await sleep(DELAY_MS);
  } catch (err) {
    console.warn(`[Sentencias/DDG] Error («${query.slice(0, 60)}»): ${err.message}`);
  }

  DDG_CACHE.set(query, resultados);
  return resultados;
}

export async function analizarSentencias(config) {
  const hallazgos = [];

  if (!cendojBloqueado) {
    for (const query of config.queriesCENDOJ) {
      const resultados = await consultarCENDOJ(query);
      for (const r of resultados) {
        if (esNegativo(`${r.titulo} ${r.resumen}`)) {
          hallazgos.push({
            fuente:      "CENDOJ",
            tipo:        "sentencia_negativa",
            titulo:      r.titulo,
            descripcion: r.resumen?.slice(0, 300) || null,
            fecha:       null,
            url:         r.url,
            puntos:      PUNTOS_SENTENCIA,
          });
        }
      }
      await sleep(DELAY_MS);
      if (cendojBloqueado) break;
    }
  }

  if (cendojBloqueado) {
    for (const query of config.queriesDDG) {
      const resultados = await buscarEnDDG(query);
      for (const r of resultados) {
        if (r.url.includes("poderjudicial.es") && esNegativo(`${r.titulo} ${r.resumen}`)) {
          hallazgos.push({
            fuente:      "CENDOJ (vía DuckDuckGo)",
            tipo:        "sentencia_negativa",
            titulo:      r.titulo,
            descripcion: r.resumen?.slice(0, 300) || null,
            fecha:       null,
            url:         r.url,
            puntos:      PUNTOS_SENTENCIA,
          });
        }
      }
    }
  }

  const seen = new Set();
  return hallazgos.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
