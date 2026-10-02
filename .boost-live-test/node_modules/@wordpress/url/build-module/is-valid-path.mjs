// packages/url/src/is-valid-path.ts
function isValidPath(path) {
  if (!path) {
    return false;
  }
  return /^[^\s#?]+$/.test(path);
}
export {
  isValidPath
};
//# sourceMappingURL=is-valid-path.mjs.map
