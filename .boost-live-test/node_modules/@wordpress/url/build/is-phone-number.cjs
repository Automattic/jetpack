"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/url/src/is-phone-number.ts
var is_phone_number_exports = {};
__export(is_phone_number_exports, {
  isPhoneNumber: () => isPhoneNumber
});
module.exports = __toCommonJS(is_phone_number_exports);
var PHONE_REGEXP = /^(tel:)?(\+)?\d{6,15}$/;
function isPhoneNumber(phoneNumber) {
  phoneNumber = phoneNumber.replace(/[-.() ]/g, "");
  return PHONE_REGEXP.test(phoneNumber);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isPhoneNumber
});
//# sourceMappingURL=is-phone-number.cjs.map
