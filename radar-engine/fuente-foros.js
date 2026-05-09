/**
 * fuente-foros.js
 * Reddit — parametrizado por nicho.
 */

import axios from "axios";

const PUNTOS_FORO = 2;
const MIN_REPLIES = 1;

const KEYWORDS_QUEJA = [
  "trampa", "fraude", "amiguismo", "enchufe", "irregularidad",
  "denunci", "escándalo", "injust", "impugn", "nulidad",
  "chanchullo", "favoritismo", "tongo", "contactos",
  "queja", "vergüenza", "corrupción", "manipulaci",
  "enchufismo", "nepotismo", "discriminaci", "ilegal",
];

const esQueja = (t) => KEYWORDS_QUEJA.some((kw) => t.toLowerCase().includes(kw));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function buscarReddit(subreddit, query) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?` +
    new URLSearchParams({ q: query, sort: "new", limit: "50", restrict_sr: "1" });

  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "web_radar/1.0 (educational project)" },
      timeout: 10_000,
    });

    const posts = data?.data?.children ?? [];
    const hallazgos = [];

    for (const { data: post } of posts) {
      const titulo = post.title    ?? "";
      const body   = post.selftext ?? "";

      if (esQueja(`${titulo} ${body}`) && (post.num_comments ?? 0) >= MIN_REPLIES) {
        hallazgos.push({
          fuente:      `Reddit r/${subreddit}`,
          tipo:        "queja_foro",
          titulo,
          descripcion: body.slice(0, 300) || null,
          fecha:       new Date(post.created_utc * 1000).toISOString(),
          url:         `https://www.reddit.com${post.permalink}`,
          puntos:      PUNTOS_FORO,
        });
      }
    }

    return hallazgos;
  } catch (err) {
    console.warn(`[Foros] Error Reddit r/${subreddit} («${query}»): ${err.message}`);
    return [];
  }
}

export async function analizarForos(config) {
  const esSobreNicho = (t) => config.keywordsTema.some((kw) => t.toLowerCase().includes(kw));
  const allHallazgos = [];

  for (const [sub, queries] of Object.entries(config.subreddits)) {
    for (const query of queries) {
      const hallazgos = await buscarReddit(sub, query);
      const filtrados = hallazgos.filter((h) => esSobreNicho(`${h.titulo} ${h.descripcion ?? ""}`));
      allHallazgos.push(...filtrados);
      if (filtrados.length > 0) {
        console.log(`[Foros] r/${sub} «${query}» → ${filtrados.length} posts`);
      }
      await sleep(1_200);
    }
  }

  const seen = new Set();
  return allHallazgos.filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
