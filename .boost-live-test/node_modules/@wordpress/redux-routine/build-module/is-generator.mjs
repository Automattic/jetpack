// packages/redux-routine/src/is-generator.ts
function isGenerator(object) {
  return !!object && typeof object[Symbol.iterator] === "function" && typeof object.next === "function";
}
export {
  isGenerator as default
};
//# sourceMappingURL=is-generator.mjs.map
