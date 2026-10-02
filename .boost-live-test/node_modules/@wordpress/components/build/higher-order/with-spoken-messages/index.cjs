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

// packages/components/src/higher-order/with-spoken-messages/index.tsx
var with_spoken_messages_exports = {};
__export(with_spoken_messages_exports, {
  default: () => with_spoken_messages_default
});
module.exports = __toCommonJS(with_spoken_messages_exports);
var import_compose = require("@wordpress/compose");
var import_a11y = require("@wordpress/a11y");
var import_jsx_runtime = require("react/jsx-runtime");
var with_spoken_messages_default = (0, import_compose.createHigherOrderComponent)((Component) => function WithSpokenMessages(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
    ...props,
    speak: import_a11y.speak,
    debouncedSpeak: (0, import_compose.useDebounce)(import_a11y.speak, 500)
  });
}, "withSpokenMessages");
//# sourceMappingURL=index.cjs.map
