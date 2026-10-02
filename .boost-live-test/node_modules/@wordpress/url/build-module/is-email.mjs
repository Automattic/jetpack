// packages/url/src/is-email.ts
var EMAIL_REGEXP = /^(mailto:)?[a-z0-9._%+-]+@[a-z0-9][a-z0-9.-]*\.[a-z]{2,63}$/i;
function isEmail(email) {
  return EMAIL_REGEXP.test(email);
}
export {
  isEmail
};
//# sourceMappingURL=is-email.mjs.map
