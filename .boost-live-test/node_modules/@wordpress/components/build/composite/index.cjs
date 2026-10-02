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

// packages/components/src/composite/index.tsx
var composite_exports = {};
__export(composite_exports, {
  Composite: () => Composite2
});
module.exports = __toCommonJS(composite_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_i18n = require("@wordpress/i18n");
var import_element = require("@wordpress/element");
var import_context = require("./context.cjs");
var import_group = require("./group.cjs");
var import_group_label = require("./group-label.cjs");
var import_hover = require("./hover.cjs");
var import_item = require("./item.cjs");
var import_row = require("./row.cjs");
var import_typeahead = require("./typeahead.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var Composite2 = Object.assign((0, import_element.forwardRef)(function Composite3({
  // Composite store props
  activeId,
  defaultActiveId,
  setActiveId,
  focusLoop = false,
  focusWrap = false,
  focusShift = false,
  virtualFocus = false,
  orientation = "both",
  rtl = (0, import_i18n.isRTL)(),
  // Composite component props
  children,
  disabled = false,
  // Rest props
  ...props
}, ref) {
  const storeProp = props.store;
  const internalStore = Ariakit.useCompositeStore({
    activeId,
    defaultActiveId,
    setActiveId,
    focusLoop,
    focusWrap,
    focusShift,
    virtualFocus,
    orientation,
    rtl
  });
  const store = storeProp ?? internalStore;
  const contextValue = (0, import_element.useMemo)(() => ({
    store
  }), [store]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.Composite, {
    disabled,
    store,
    ...props,
    ref,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_context.CompositeContext.Provider, {
      value: contextValue,
      children
    })
  });
}), {
  /**
   * Renders a group element for composite items.
   *
   * @example
   * ```jsx
   * import { Composite } from '@wordpress/components';
   *
   * <Composite>
   *   <Composite.Group>
   *     <Composite.GroupLabel>Label</Composite.GroupLabel>
   *     <Composite.Item>Item 1</Composite.Item>
   *     <Composite.Item>Item 2</Composite.Item>
   *   </CompositeGroup>
   * </Composite>
   * ```
   */
  Group: Object.assign(import_group.CompositeGroup, {
    displayName: "Composite.Group"
  }),
  /**
   * Renders a label in a composite group. This component must be wrapped with
   * `Composite.Group` so the `aria-labelledby` prop is properly set on the
   * composite group element.
   *
   * @example
   * ```jsx
   * import { Composite } from '@wordpress/components';
   *
   * <Composite>
   *   <Composite.Group>
   *     <Composite.GroupLabel>Label</Composite.GroupLabel>
   *     <Composite.Item>Item 1</Composite.Item>
   *     <Composite.Item>Item 2</Composite.Item>
   *   </CompositeGroup>
   * </Composite>
   * ```
   */
  GroupLabel: Object.assign(import_group_label.CompositeGroupLabel, {
    displayName: "Composite.GroupLabel"
  }),
  /**
   * Renders a composite item.
   *
   * @example
   * ```jsx
   * import { Composite } from '@wordpress/components';
   *
   * <Composite>
   *   <Composite.Item>Item 1</Composite.Item>
   *   <Composite.Item>Item 2</Composite.Item>
   *   <Composite.Item>Item 3</Composite.Item>
   * </Composite>
   * ```
   */
  Item: Object.assign(import_item.CompositeItem, {
    displayName: "Composite.Item"
  }),
  /**
   * Renders a composite row. Wrapping `Composite.Item` elements within
   * `Composite.Row` will create a two-dimensional composite widget, such as a
   * grid.
   *
   * @example
   * ```jsx
   * import { Composite } from '@wordpress/components';
   *
   * <Composite>
   *   <Composite.Row>
   *     <Composite.Item>Item 1.1</Composite.Item>
   *     <Composite.Item>Item 1.2</Composite.Item>
   *     <Composite.Item>Item 1.3</Composite.Item>
   *   </Composite.Row>
   *   <Composite.Row>
   *     <Composite.Item>Item 2.1</Composite.Item>
   *     <Composite.Item>Item 2.2</Composite.Item>
   *     <Composite.Item>Item 2.3</Composite.Item>
   *   </Composite.Row>
   * </Composite>
   * ```
   */
  Row: Object.assign(import_row.CompositeRow, {
    displayName: "Composite.Row"
  }),
  /**
   * Renders an element in a composite widget that receives focus on mouse move
   * and loses focus to the composite base element on mouse leave. This should
   * be combined with the `Composite.Item` component.
   *
   * @example
   * ```jsx
   * import { Composite } from '@wordpress/components';
   *
   * <Composite>
   *   <Composite.Hover render={ <Composite.Item /> }>
   *     Item 1
   *   </Composite.Hover>
   *   <Composite.Hover render={ <Composite.Item /> }>
   *     Item 2
   *   </Composite.Hover>
   * </Composite>
   * ```
   */
  Hover: Object.assign(import_hover.CompositeHover, {
    displayName: "Composite.Hover"
  }),
  /**
   * Renders a component that adds typeahead functionality to composite
   * components. Hitting printable character keys will move focus to the next
   * composite item that begins with the input characters.
   *
   * @example
   * ```jsx
   * import { Composite } from '@wordpress/components';
   *
   * <Composite render={ <CompositeTypeahead /> }>
   *   <Composite.Item>Item 1</Composite.Item>
   *   <Composite.Item>Item 2</Composite.Item>
   * </Composite>
   * ```
   */
  Typeahead: Object.assign(import_typeahead.CompositeTypeahead, {
    displayName: "Composite.Typeahead"
  }),
  /**
   * The React context used by the composite components. It can be used by
   * to access the composite store, and to forward the context when composite
   * sub-components are rendered across portals (ie. `SlotFill` components)
   * that would not otherwise forward the context to the `Fill` children.
   *
   * @example
   * ```jsx
   * import { Composite } from '@wordpress/components';
   * import { useContext } from '@wordpress/element';
   *
   * const compositeContext = useContext( Composite.Context );
   * ```
   */
  Context: Object.assign(import_context.CompositeContext, {
    displayName: "Composite.Context"
  })
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Composite
});
//# sourceMappingURL=index.cjs.map
