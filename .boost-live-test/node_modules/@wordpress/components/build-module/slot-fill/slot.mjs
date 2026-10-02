// packages/components/src/slot-fill/slot.tsx
import { useObservableValue } from "@wordpress/compose";
import { useContext, useLayoutEffect, useRef, Children, cloneElement, isEmptyElement } from "@wordpress/element";
import SlotFillContext from "./context.mjs";
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
function isFunction(maybeFunc) {
  return typeof maybeFunc === "function";
}
function addKeysToChildren(children) {
  return Children.map(children, (child, childIndex) => {
    if (!child || typeof child === "string") {
      return child;
    }
    let childKey = childIndex;
    if (typeof child === "object" && "key" in child && child?.key) {
      childKey = child.key;
    }
    return cloneElement(child, {
      key: childKey
    });
  });
}
function Slot(props) {
  const {
    name,
    children,
    fillProps = {}
  } = props;
  const registry = useContext(SlotFillContext);
  const instanceRef = useRef({});
  useLayoutEffect(() => {
    const instance = instanceRef.current;
    registry.registerSlot(name, {
      type: "children",
      instance
    });
    return () => registry.unregisterSlot(name, instance);
  }, [registry, name]);
  let fills = useObservableValue(registry.fills, name) ?? [];
  const currentSlot = useObservableValue(registry.slots, name);
  if (!currentSlot || currentSlot.instance !== instanceRef.current) {
    fills = [];
  }
  const renderedFills = fills.map((fill) => {
    const fillChildren = isFunction(fill.children) ? fill.children(fillProps) : fill.children;
    return addKeysToChildren(fillChildren);
  }).filter(
    // In some cases fills are rendered only when some conditions apply.
    // This ensures that we only use non-empty fills when rendering, i.e.,
    // it allows us to render wrappers only when the fills are actually present.
    (element) => !isEmptyElement(element)
  );
  return /* @__PURE__ */ _jsx(_Fragment, {
    children: isFunction(children) ? children(renderedFills) : renderedFills
  });
}
var slot_default = Slot;
export {
  slot_default as default
};
//# sourceMappingURL=slot.mjs.map
