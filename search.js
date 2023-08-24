const googlethis = require('googlethis');
const axios = require('axios').default;

/**
 * @typedef {Object} SearcherResultItem
 * @property {string} [title] - The title (optional).
 * @property {string} description - The description.
 * @property {string} url - The URL.
 */

/**
 * @param {...string} queries - One or more search queries.
 * @returns {Promsie<SearcherResultItem[]>}
 */
const ddgSearch = async (...queries) => {
  return (await Promise.all(queries.map(async (query) => {
    try {
      /** @type {{ title: string, link: string, snippet: string }[]} */
      const searching = (await axios.get(`https://ddg-api.herokuapp.com/search?query=${query}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50'
        }
      })).data
      return searching.map((p) => ({ title: p.title || '', url: p.link || '', description: p.snippet || '' }))
    } catch {
      return []
    }
  }))).flat()
}

/**
 * @async
 * @param {...string} queries - One or more search queries.
 * @returns {Promsie<SearcherResultItem[]>}
 */
const googleSearch = async (...queries) => {
  return (await Promise.all(queries.map(async (query) => {
    try {
      const searching = await googlethis.search(query)
      return [...searching.results, ...searching.top_stories]
    } catch {
      return []
    }
  }))).flat()
}

/**
 * Generate a summary string from an array of search result items.
 * @param {SearcherResultItem[]} items - An array of search result items.
 * @param {boolean} [showUrl=true] - Whether to include URLs in the summary.
 * @returns {string} The generated summary string.
 */
const summary = (items, showUrl = true) => {
    /** @type{Map<string, SearcherResultItem>} */
    const pages = new Map()
    items.forEach((value) => pages.set(value.url, value))
    items = [...pages.values()]
  return [...new Set(items
    .map((r) => `${showUrl ? r.url + '\n' : ''}${r.title ? r.title : ''}\n${r.description}`))
  ].join('\n\n')
}

/**
 * @async
 * @param {boolean} [showUrl=true] - Whether to include URLs in the summary.
 * @param {...string} queries - One or more search queries.
 * @returns {Promise<string>} The generated summary string.
 */
const ddgSearchSummary = async (showUrl=true, ...queries) => {
  return summary(await ddgSearch(...queries), showUrl)
}

/**
 * @async
 * @param {boolean} [showUrl=true] - Whether to include URLs in the summary.
 * @param {...string} queries - One or more search queries.
 * @returns {Promise<string>} The generated summary string.
 */
const googleSearchSummary = async (showUrl=true, ...queries) => {
  return summary(await googleSearch(...queries), showUrl)
}

module.exports = {
  googleSearch,
  ddgSearch,
  googleSearchSummary,
  ddgSearchSummary
}
