// packages/components/src/shortcut/index.tsx
import { jsx as _jsx } from "react/jsx-runtime";
function Shortcut(props) {
  const {
    shortcut,
    className
  } = props;
  if (!shortcut) {
    return null;
  }
  let displayText;
  let ariaLabel;
  if (typeof shortcut === "string") {
    displayText = shortcut;
  }
  if (shortcut !== null && typeof shortcut === "object") {
    displayText = shortcut.display;
    ariaLabel = shortcut.ariaLabel;
  }
  return /* @__PURE__ */ _jsx("span", {
    className,
    "aria-label": ariaLabel,
    children: displayText
  });
}
var shortcut_default = Shortcut;
export {
  shortcut_default as default
};
//# sourceMappingURL=index.mjs.map
