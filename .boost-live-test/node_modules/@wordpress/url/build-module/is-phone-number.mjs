// packages/url/src/is-phone-number.ts
var PHONE_REGEXP = /^(tel:)?(\+)?\d{6,15}$/;
function isPhoneNumber(phoneNumber) {
  phoneNumber = phoneNumber.replace(/[-.() ]/g, "");
  return PHONE_REGEXP.test(phoneNumber);
}
export {
  isPhoneNumber
};
//# sourceMappingURL=is-phone-number.mjs.map
