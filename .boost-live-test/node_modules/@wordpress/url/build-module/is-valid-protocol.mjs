// packages/url/src/is-valid-protocol.ts
function isValidProtocol(protocol) {
  if (!protocol) {
    return false;
  }
  return /^[a-z\-.\+]+[0-9]*:$/i.test(protocol);
}
export {
  isValidProtocol
};
//# sourceMappingURL=is-valid-protocol.mjs.map
