// packages/url/src/get-path.ts
function getPath(url) {
  const matches = /^[^\/\s:]+:(?:\/\/)?[^\/\s#?]+[\/]([^\s#?]+)[#?]{0,1}\S*$/.exec(url);
  if (matches) {
    return matches[1];
  }
}
export {
  getPath
};
//# sourceMappingURL=get-path.mjs.map
