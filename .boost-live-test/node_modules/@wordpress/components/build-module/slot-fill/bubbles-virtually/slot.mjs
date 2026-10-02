// packages/components/src/slot-fill/bubbles-virtually/slot.tsx
import { useRef, useLayoutEffect, useContext, forwardRef } from "@wordpress/element";
import { useMergeRefs } from "@wordpress/compose";
import { View } from "../../view/index.mjs";
import SlotFillContext from "../context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function Slot(props, forwardedRef) {
  const {
    name,
    fillProps = {},
    as,
    // `children` is not allowed. However, if it is passed,
    // it will be displayed as is, so remove `children`.
    children,
    ...restProps
  } = props;
  const registry = useContext(SlotFillContext);
  const instanceRef = useRef({});
  const ref = useRef(null);
  const fillPropsRef = useRef(fillProps);
  useLayoutEffect(() => {
    fillPropsRef.current = fillProps;
  }, [fillProps]);
  useLayoutEffect(() => {
    const instance = instanceRef.current;
    registry.registerSlot(name, {
      type: "portal",
      instance,
      ref,
      fillProps: fillPropsRef.current
    });
    return () => registry.unregisterSlot(name, instance);
  }, [registry, name]);
  useLayoutEffect(() => {
    registry.updateSlot(name, {
      type: "portal",
      instance: instanceRef.current,
      ref,
      fillProps: fillPropsRef.current
    });
  });
  return /* @__PURE__ */ _jsx(View, {
    as,
    ref: useMergeRefs([forwardedRef, ref]),
    ...restProps
  });
}
var slot_default = forwardRef(Slot);
export {
  slot_default as default
};
//# sourceMappingURL=slot.mjs.map
