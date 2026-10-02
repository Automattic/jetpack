// packages/dom/src/utils/assert-is-defined.ts
function assertIsDefined(val, name) {
  if (process.env.NODE_ENV !== "production" && (val === void 0 || val === null)) {
    throw new Error(
      `Expected '${name}' to be defined, but received ${val}`
    );
  }
}
export {
  assertIsDefined
};
//# sourceMappingURL=assert-is-defined.mjs.map
