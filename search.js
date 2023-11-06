const axios = require('axios');
const { load: cheerioLoad } = require('cheerio');
const qs = require('qs');

/**
 * @typedef {Object} SearcherResultItem
 * @property {string} title - The title of the search result.
 * @property {string} description - The description of the search result.
 * @property {string} url - The URL of the search result.
 */

/**
 * Test if a URL starts with 'http' or 'https'.
 *
 * @param {string} url - The URL to test.
 * @returns {boolean} Returns true if the URL starts with 'http' or 'https', otherwise false.
 */
function urlTest(url) {
  return (/^https?:/).test(url);
}

/**
 * Create a random User-Agent header.
 *
 * @returns {Object} Returns an object with a 'User-Agent' header.
 */
function createHeader() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  };
}

/**
 * Perform a DuckDuckGo search.
 *
 * @param {string} query - The search query.
 * @returns {Promise<SearcherResultItem[]>} Returns a Promise that resolves to an array of search results.
 */
async function _ddgSearch(query) {
  const region = 'wt-wt';
  const timelimit = undefined;
  const safesearch = 'off';
  const headers = createHeader();
  const res1 = await axios.get(`https://duckduckgo.com/?${qs.stringify({
    q: query,
    kl: region,
    p: ({on: 1, moderate: -1, off: -2})[safesearch],
    df: timelimit
  })}`, { headers });
  const $1 = cheerioLoad(res1.data);
  const href1 = $1('#deep_preload_link').attr('href') || '';
  const href2 = $1('#deep_preload_script').attr('src') || '';
  const vqd = (qs.parse(href1.split('?').at(-1) || '') || qs.parse(href2.split('?').at(-1) || ''))?.vqd;
  const ddgSearchUrl = `https://links.duckduckgo.com/d.js?${qs.stringify({
    q: query,
    kl: region,
    l: region,
    bing_market: `${region.split('-')[0]}-${(region.split('-').at(-1) || '').toUpperCase()}`,
    s: 0,
    df: timelimit,
    vqd: vqd,
    o: 'json',
    sp: 0,
  })}`;
  return ((await axios.get(ddgSearchUrl, { headers })).data.results.map(r => ({
    title: r.t || '',
    description: cheerioLoad(r.a || '').text(),
    url: r.u || ''
  })).filter(r => urlTest(r.url)));
}

/**
 * Perform a Google search.
 *
 * @param {string} query - The search query.
 * @returns {Promise<SearcherResultItem[]>} Returns a Promise that resolves to an array of search results.
 */
async function _googleSearch(query) {
  const res = await axios.get(`https://www.google.com/search?q=${query}`);
  const $ = cheerioLoad(res.data);
  const items = [...$('#main').children('div')];
  items.shift();
  while (items[0].children.length === 0) {
    items.shift();
  }
  return items.map((item) => {
    const a = $(item).find('a').first();
    const url = qs.parse((a.attr('href') || '').split('?').at(-1) || '')?.q || '';
    const title = a.find('h3').first().text() || undefined;
    const description = $(item).children().last().children().last().text().replace(/�/g, '') || undefined;
    if (!urlTest(url)) return null;
    return { url, title, description };
  }).filter(i => i);
}

/**
 * Perform DuckDuckGo searches for multiple queries.
 *
 * @param {...string} queries - The search queries.
 * @returns {Promise<SearcherResultItem[]>} Returns a Promise that resolves to an array of search results.
 */
const ddgSearch = async (...queries) => {
  for (let i = 0; i < 3; i++) {
    try {
      return (await Promise.all(queries.map(q => _ddgSearch(q)))).flat();
    } catch (err) {
      console.log(err);
    }
  }
  return [];
}

/**
 * Perform Google searches for multiple queries.
 *
 * @param {...string} queries - The search queries.
 * @returns {Promise<SearcherResultItem[]>} Returns a Promise that resolves to an array of search results.
 */
const googleSearch = async (...queries) => {
  for (let i = 0; i < 3; i++) {
    try {
      return (await Promise.all(queries.map(q => _googleSearch(q)))).flat();
    } catch (err) {
      console.log(err);
    }
  }
  return [];
}

/**
 * Generate a summary of search results.
 *
 * @param {SearcherResultItem[]} items - An array of search result items.
 * @param {boolean} showUrl - Whether to show URLs in the summary.
 * @returns {string} Returns a summary of the search results.
 */
const summary = (items, showUrl = true) => {
  const pages = new Map();
  items.forEach((value) => pages.set(value.url, value));
  items = [...pages.values()];
  return [...new Set(items
    .map((r) => `${showUrl ? r.url + '\n' : ''}${r.title ? r.title : ''}\n${r.description}`))
  ].join('\n\n');
}

/**
 * Generate a DuckDuckGo search summary.
 *
 * @param {boolean} showUrl - Whether to show URLs in the summary.
 * @param {...string} queries - The search queries.
 * @returns {Promise<string>} Returns a Promise that resolves to a summary of DuckDuckGo search results.
 */
const ddgSearchSummary = async (showUrl = true, ...queries) => {
  return summary(await ddgSearch(...queries), showUrl);
}

/**
 * Generate a Google search summary.
 *
 * @param {boolean} showUrl - Whether to show URLs in the summary.
 * @param {...string} queries - The search queries.
 * @returns {Promise<string>} Returns a Promise that resolves to a summary of Google search results.
 */
const googleSearchSummary = async (showUrl = true, ...queries) => {
  return summary(await googleSearch(...queries), showUrl);
}

function googleExtractText($, el, isRoot = false, showUrl = true) {
  try {
    const children = $(el).children('*')
    let href = $(el).prop('href') || undefined
    if (href && href.startsWith('/search')) throw 'no need'
    let text = (children.length == 0
      ? $(el).text()
      : [...children].map(c => googleExtractText($, c, false, showUrl)).join('\n')).trim()
    if (href?.startsWith('/url')) href = (qs.parse(href.split('?')[1]) || {}).q || ''
    else href = undefined
    return `${showUrl && href ? href + '\n' : ''}${text}`
  } catch (e) {
    if (isRoot) return ''
    else throw e
  }
}

const _googleSearchSummaryV2 = async (query, showUrl = true) => {
  const res = await axios.get(`https://www.google.com/search?q=${query}`)
  const $ = cheerioLoad(res.data)
  const items = [...$('#main').children('div')]
  const text = items.map(i => googleExtractText($, i, true)).join('\n\n').trim()
    .replace(/(\n{2,})/g, '\n\n').replace(/�/g, '')
  return text

}

const googleSearchSummaryV2 = async (showUrl=true, ...queries) => {
  return (await Promise.all(queries.map((query) => _googleSearchSummaryV2(query, showUrl)))).join('\n\n---\n\n')
}

module.exports = {
  googleSearch,
  ddgSearch,
  googleSearchSummary,
  googleSearchSummaryV2,
  ddgSearchSummary
};
