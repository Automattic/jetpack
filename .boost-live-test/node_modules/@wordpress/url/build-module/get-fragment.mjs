// packages/url/src/get-fragment.ts
function getFragment(url) {
  const matches = /^\S+?(#[^\s\?]*)/.exec(url);
  if (matches) {
    return matches[1];
  }
}
export {
  getFragment
};
//# sourceMappingURL=get-fragment.mjs.map
