// packages/url/src/get-protocol.ts
function getProtocol(url) {
  const matches = /^([^\s:]+:)/.exec(url);
  if (matches) {
    return matches[1];
  }
}
export {
  getProtocol
};
//# sourceMappingURL=get-protocol.mjs.map
