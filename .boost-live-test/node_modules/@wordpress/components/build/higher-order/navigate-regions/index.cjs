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

// packages/components/src/higher-order/navigate-regions/index.tsx
var navigate_regions_exports = {};
__export(navigate_regions_exports, {
  default: () => navigate_regions_default,
  useNavigateRegions: () => useNavigateRegions
});
module.exports = __toCommonJS(navigate_regions_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_keycodes = require("@wordpress/keycodes");
var import_jsx_runtime = require("react/jsx-runtime");
var defaultShortcuts = {
  previous: [{
    modifier: "ctrlShift",
    character: "`"
  }, {
    modifier: "ctrlShift",
    character: "~"
  }, {
    modifier: "access",
    character: "p"
  }],
  next: [{
    modifier: "ctrl",
    character: "`"
  }, {
    modifier: "access",
    character: "n"
  }]
};
function useNavigateRegions(shortcuts = defaultShortcuts) {
  const ref = (0, import_element.useRef)(null);
  const [isFocusingRegions, setIsFocusingRegions] = (0, import_element.useState)(false);
  function focusRegion(offset) {
    const regions = Array.from(ref.current?.querySelectorAll('[role="region"][tabindex="-1"]') ?? []);
    if (!regions.length) {
      return;
    }
    let nextRegion = regions[0];
    const wrappingRegion = ref.current?.ownerDocument?.activeElement?.closest('[role="region"][tabindex="-1"]');
    const selectedIndex = wrappingRegion ? regions.indexOf(wrappingRegion) : -1;
    if (selectedIndex !== -1) {
      let nextIndex = selectedIndex + offset;
      nextIndex = nextIndex === -1 ? regions.length - 1 : nextIndex;
      nextIndex = nextIndex === regions.length ? 0 : nextIndex;
      nextRegion = regions[nextIndex];
    }
    nextRegion.focus();
    setIsFocusingRegions(true);
  }
  const clickRef = (0, import_compose.useRefEffect)((element) => {
    function onClick() {
      setIsFocusingRegions(false);
    }
    element.addEventListener("click", onClick);
    return () => {
      element.removeEventListener("click", onClick);
    };
  }, [setIsFocusingRegions]);
  return {
    ref: (0, import_compose.useMergeRefs)([ref, clickRef]),
    className: isFocusingRegions ? "is-focusing-regions" : "",
    onKeyDown(event) {
      if (shortcuts.previous.some(({
        modifier,
        character
      }) => {
        return import_keycodes.isKeyboardEvent[modifier](event, character);
      })) {
        focusRegion(-1);
      } else if (shortcuts.next.some(({
        modifier,
        character
      }) => {
        return import_keycodes.isKeyboardEvent[modifier](event, character);
      })) {
        focusRegion(1);
      }
    }
  };
}
var navigate_regions_default = (0, import_compose.createHigherOrderComponent)((Component) => function NavigateRegions({
  shortcuts,
  ...props
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
    ...useNavigateRegions(shortcuts),
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
      ...props
    })
  });
}, "navigateRegions");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useNavigateRegions
});
//# sourceMappingURL=index.cjs.map
