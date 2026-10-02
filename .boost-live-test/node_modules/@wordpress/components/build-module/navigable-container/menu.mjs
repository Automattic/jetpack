// packages/components/src/navigable-container/menu.tsx
import { forwardRef } from "@wordpress/element";
import NavigableContainer from "./container.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedNavigableMenu({
  role = "menu",
  orientation = "vertical",
  ...rest
}, ref) {
  const eventToOffset = (evt) => {
    const {
      code
    } = evt;
    let next = ["ArrowDown"];
    let previous = ["ArrowUp"];
    if (orientation === "horizontal") {
      next = ["ArrowRight"];
      previous = ["ArrowLeft"];
    }
    if (orientation === "both") {
      next = ["ArrowRight", "ArrowDown"];
      previous = ["ArrowLeft", "ArrowUp"];
    }
    if (next.includes(code)) {
      return 1;
    } else if (previous.includes(code)) {
      return -1;
    } else if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(code)) {
      return 0;
    }
    return void 0;
  };
  return /* @__PURE__ */ _jsx(NavigableContainer, {
    ref,
    stopNavigationEvents: true,
    onlyBrowserTabstops: false,
    role,
    "aria-orientation": role !== "presentation" && (orientation === "vertical" || orientation === "horizontal") ? orientation : void 0,
    eventToOffset,
    ...rest
  });
}
var NavigableMenu = forwardRef(UnforwardedNavigableMenu);
NavigableMenu.displayName = "NavigableMenu";
var menu_default = NavigableMenu;
export {
  NavigableMenu,
  UnforwardedNavigableMenu,
  menu_default as default
};
//# sourceMappingURL=menu.mjs.map
