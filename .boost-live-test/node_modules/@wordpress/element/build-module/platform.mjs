// packages/element/src/platform.ts
var Platform = {
  /** Platform identifier. Will always be `'web'` in this module. */
  OS: "web",
  /**
   * Select a value based on the platform.
   *
   * @template T
   * @param    spec - Object with optional platform-specific values.
   * @return The selected value.
   */
  select(spec) {
    return "web" in spec ? spec.web : spec.default;
  },
  /** Whether the platform is web */
  isWeb: true
};
var platform_default = Platform;
export {
  platform_default as default
};
//# sourceMappingURL=platform.mjs.map
