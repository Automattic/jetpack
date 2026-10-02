// packages/keycodes/src/platform.ts
function isAppleOS(_window) {
  if (!_window) {
    if (typeof window === "undefined") {
      return false;
    }
    _window = window;
  }
  const { platform } = _window.navigator;
  return platform.indexOf("Mac") !== -1 || ["iPad", "iPhone"].includes(platform);
}
export {
  isAppleOS
};
//# sourceMappingURL=platform.mjs.map
