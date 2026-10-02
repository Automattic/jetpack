// packages/url/src/is-valid-authority.ts
function isValidAuthority(authority) {
  if (!authority) {
    return false;
  }
  return /^[^\s#?]+$/.test(authority);
}
export {
  isValidAuthority
};
//# sourceMappingURL=is-valid-authority.mjs.map
