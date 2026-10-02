// packages/url/src/is-valid-fragment.ts
function isValidFragment(fragment) {
  if (!fragment) {
    return false;
  }
  return /^#[^\s#?\/]*$/.test(fragment);
}
export {
  isValidFragment
};
//# sourceMappingURL=is-valid-fragment.mjs.map
