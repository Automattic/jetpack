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

// packages/components/src/composite/legacy/index.tsx
var legacy_exports = {};
__export(legacy_exports, {
  Composite: () => Composite,
  CompositeGroup: () => CompositeGroup,
  CompositeItem: () => CompositeItem,
  useCompositeState: () => useCompositeState
});
module.exports = __toCommonJS(legacy_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import__ = require("../index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function mapLegacyStatePropsToComponentProps(legacyProps) {
  if (legacyProps.state) {
    const {
      state,
      ...rest
    } = legacyProps;
    const {
      store,
      ...props
    } = mapLegacyStatePropsToComponentProps(state);
    return {
      ...rest,
      ...props,
      store
    };
  }
  return legacyProps;
}
var LEGACY_TO_NEW_DISPLAY_NAME = {
  __unstableComposite: "Composite",
  __unstableCompositeGroup: "Composite.Group or Composite.Row",
  __unstableCompositeItem: "Composite.Item",
  __unstableUseCompositeState: "Composite"
};
function proxyComposite(ProxiedComponent, propMap = {}) {
  const displayName = ProxiedComponent.displayName ?? "";
  const Component = (legacyProps) => {
    (0, import_deprecated.default)(`wp.components.${displayName}`, {
      since: "6.7",
      alternative: LEGACY_TO_NEW_DISPLAY_NAME.hasOwnProperty(displayName) ? LEGACY_TO_NEW_DISPLAY_NAME[displayName] : void 0
    });
    const {
      store,
      ...rest
    } = mapLegacyStatePropsToComponentProps(legacyProps);
    let props = rest;
    props = {
      ...props,
      id: (0, import_compose.useInstanceId)(store, props.baseId, props.id)
    };
    Object.entries(propMap).forEach(([from, to]) => {
      if (props.hasOwnProperty(from)) {
        Object.assign(props, {
          [to]: props[from]
        });
        delete props[from];
      }
    });
    delete props.baseId;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProxiedComponent, {
      ...props,
      store
    });
  };
  Component.displayName = displayName;
  return Component;
}
var UnproxiedCompositeGroup = (0, import_element.forwardRef)(({
  role,
  ...props
}, ref) => {
  const Component = role === "row" ? import__.Composite.Row : import__.Composite.Group;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
    ref,
    role,
    ...props
  });
});
var Composite = proxyComposite(Object.assign(import__.Composite, {
  displayName: "__unstableComposite"
}), {
  baseId: "id"
});
var CompositeGroup = proxyComposite(Object.assign(UnproxiedCompositeGroup, {
  displayName: "__unstableCompositeGroup"
}));
var CompositeItem = proxyComposite(Object.assign(import__.Composite.Item, {
  displayName: "__unstableCompositeItem"
}), {
  focusable: "accessibleWhenDisabled"
});
function useCompositeState(legacyStateOptions = {}) {
  (0, import_deprecated.default)(`wp.components.__unstableUseCompositeState`, {
    since: "6.7",
    alternative: LEGACY_TO_NEW_DISPLAY_NAME.__unstableUseCompositeState
  });
  const {
    baseId,
    currentId: defaultActiveId,
    orientation,
    rtl = false,
    loop: focusLoop = false,
    wrap: focusWrap = false,
    shift: focusShift = false,
    unstable_virtual: virtualFocus
  } = legacyStateOptions;
  return {
    baseId: (0, import_compose.useInstanceId)(Composite, "composite", baseId),
    store: Ariakit.useCompositeStore({
      defaultActiveId,
      rtl,
      orientation,
      focusLoop,
      focusShift,
      focusWrap,
      virtualFocus
    })
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Composite,
  CompositeGroup,
  CompositeItem,
  useCompositeState
});
//# sourceMappingURL=index.cjs.map
