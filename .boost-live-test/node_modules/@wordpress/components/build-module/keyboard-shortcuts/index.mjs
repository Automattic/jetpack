// packages/components/src/keyboard-shortcuts/index.tsx
import { useRef, Children } from "@wordpress/element";
import { useKeyboardShortcut } from "@wordpress/compose";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function KeyboardShortcut({
  target,
  callback,
  shortcut,
  bindGlobal,
  eventName
}) {
  useKeyboardShortcut(shortcut, callback, {
    bindGlobal,
    target,
    eventName
  });
  return null;
}
function KeyboardShortcuts({
  children,
  shortcuts,
  bindGlobal,
  eventName
}) {
  const target = useRef(null);
  const element = Object.entries(shortcuts ?? {}).map(([shortcut, callback]) => /* @__PURE__ */ _jsx(KeyboardShortcut, {
    shortcut,
    callback,
    bindGlobal,
    eventName,
    target
  }, shortcut));
  if (!Children.count(children)) {
    return /* @__PURE__ */ _jsx(_Fragment, {
      children: element
    });
  }
  return /* @__PURE__ */ _jsxs("div", {
    ref: target,
    children: [element, children]
  });
}
var keyboard_shortcuts_default = KeyboardShortcuts;
export {
  keyboard_shortcuts_default as default
};
//# sourceMappingURL=index.mjs.map
