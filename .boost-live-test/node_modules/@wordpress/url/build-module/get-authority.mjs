// packages/url/src/get-authority.ts
function getAuthority(url) {
  const matches = /^[^\/\s:]+:(?:\/\/)?\/?([^\/\s#?]+)[\/#?]{0,1}\S*$/.exec(
    url
  );
  if (matches) {
    return matches[1];
  }
}
export {
  getAuthority
};
//# sourceMappingURL=get-authority.mjs.map
