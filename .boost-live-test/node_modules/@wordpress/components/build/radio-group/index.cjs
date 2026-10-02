"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/radio-group/index.tsx
var radio_group_exports = {};
__export(radio_group_exports, {
  RadioGroup: () => RadioGroup2,
  default: () => radio_group_default
});
module.exports = __toCommonJS(radio_group_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_element = require("@wordpress/element");
var import_i18n = require("@wordpress/i18n");
var import_button_group = __toESM(require("../button-group/index.cjs"));
var import_context = require("./context.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedRadioGroup({
  label,
  checked,
  defaultChecked,
  disabled,
  onChange,
  children,
  ...props
}, ref) {
  const radioStore = Ariakit.useRadioStore({
    value: checked,
    defaultValue: defaultChecked,
    setValue: (newValue) => {
      onChange?.(newValue ?? void 0);
    },
    rtl: (0, import_i18n.isRTL)()
  });
  const contextValue = (0, import_element.useMemo)(() => ({
    store: radioStore,
    disabled
  }), [radioStore, disabled]);
  (0, import_deprecated.default)("wp.components.__experimentalRadioGroup", {
    alternative: "wp.components.RadioControl or wp.components.__experimentalToggleGroupControl",
    since: "6.8"
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_context.RadioGroupContext.Provider, {
    value: contextValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.RadioGroup, {
      store: radioStore,
      render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button_group.default, {
        __shouldNotWarnDeprecated: true,
        children
      }),
      "aria-label": label,
      ref,
      ...props
    })
  });
}
var RadioGroup2 = (0, import_element.forwardRef)(UnforwardedRadioGroup);
RadioGroup2.displayName = "RadioGroup";
var radio_group_default = RadioGroup2;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RadioGroup
});
//# sourceMappingURL=index.cjs.map
