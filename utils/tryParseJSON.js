module.exports = function tryParseJSON (obj) {
  try {
    return JSON.parse(obj)
  } catch {
    return obj
  }
}