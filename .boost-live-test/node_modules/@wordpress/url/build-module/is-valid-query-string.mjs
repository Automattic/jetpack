// packages/url/src/is-valid-query-string.ts
function isValidQueryString(queryString) {
  if (!queryString) {
    return false;
  }
  return /^[^\s#?\/]+$/.test(queryString);
}
export {
  isValidQueryString
};
//# sourceMappingURL=is-valid-query-string.mjs.map
