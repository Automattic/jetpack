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

// packages/components/src/h-stack/hook.tsx
var hook_exports = {};
__export(hook_exports, {
  useHStack: () => useHStack
});
module.exports = __toCommonJS(hook_exports);
var import_context = require("../context/index.cjs");
var import_flex = require("../flex/index.cjs");
var import_utils = require("./utils.cjs");
var import_get_valid_children = require("../utils/get-valid-children.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function useHStack(props) {
  const {
    alignment = "edge",
    children,
    direction,
    spacing = 2,
    ...otherProps
  } = (0, import_context.useContextSystem)(props, "HStack");
  const align = (0, import_utils.getAlignmentProps)(alignment, direction);
  const validChildren = (0, import_get_valid_children.getValidChildren)(children);
  const clonedChildren = validChildren.map((child, index) => {
    const _isSpacer = (0, import_context.hasConnectNamespace)(child, ["Spacer"]);
    if (_isSpacer) {
      const childElement = child;
      const _key = childElement.key || `hstack-${index}`;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_flex.FlexItem, {
        isBlock: true,
        ...childElement.props
      }, _key);
    }
    return child;
  });
  const propsForFlex = {
    children: clonedChildren,
    direction,
    justify: "center",
    ...align,
    ...otherProps,
    gap: spacing
  };
  const {
    isColumn,
    ...flexProps
  } = (0, import_flex.useFlex)(propsForFlex);
  return flexProps;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useHStack
});
//# sourceMappingURL=hook.cjs.map
