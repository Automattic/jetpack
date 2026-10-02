// packages/url/src/is-url.ts
function isURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
export {
  isURL
};
//# sourceMappingURL=is-url.mjs.map
