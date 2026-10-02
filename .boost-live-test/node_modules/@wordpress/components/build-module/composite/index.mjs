// packages/components/src/composite/index.tsx
import * as Ariakit from "@ariakit/react";
import { isRTL } from "@wordpress/i18n";
import { useMemo, forwardRef } from "@wordpress/element";
import { CompositeContext } from "./context.mjs";
import { CompositeGroup } from "./group.mjs";
import { CompositeGroupLabel } from "./group-label.mjs";
import { CompositeHover } from "./hover.mjs";
import { CompositeItem } from "./item.mjs";
import { CompositeRow } from "./row.mjs";
import { CompositeTypeahead } from "./typeahead.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var Composite2 = Object.assign(forwardRef(function Composite3({
  // Composite store props
  activeId,
  defaultActiveId,
  setActiveId,
  focusLoop = false,
  focusWrap = false,
  focusShift = false,
  virtualFocus = false,
  orientation = "both",
  rtl = isRTL(),
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
  const contextValue = useMemo(() => ({
    store
  }), [store]);
  return /* @__PURE__ */ _jsx(Ariakit.Composite, {
    disabled,
    store,
    ...props,
    ref,
    children: /* @__PURE__ */ _jsx(CompositeContext.Provider, {
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
  Group: Object.assign(CompositeGroup, {
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
  GroupLabel: Object.assign(CompositeGroupLabel, {
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
  Item: Object.assign(CompositeItem, {
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
  Row: Object.assign(CompositeRow, {
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
  Hover: Object.assign(CompositeHover, {
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
  Typeahead: Object.assign(CompositeTypeahead, {
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
  Context: Object.assign(CompositeContext, {
    displayName: "Composite.Context"
  })
});
export {
  Composite2 as Composite
};
//# sourceMappingURL=index.mjs.map
