// packages/compose/src/hooks/use-focus-on-mount/index.ts
import { focus } from "@wordpress/dom";
import { useEffect, useRef } from "@wordpress/element";
import useRefEffect from "../use-ref-effect/index.mjs";
function useFocusOnMount(focusOnMount = "firstElement") {
  const focusOnMountRef = useRef(focusOnMount);
  const setFocus = (target) => {
    target.focus({
      // When focusing newly mounted dialogs,
      // the position of the popover is often not right on the first render
      // This prevents the layout shifts when focusing the dialogs.
      preventScroll: true
    });
  };
  useEffect(() => {
    focusOnMountRef.current = focusOnMount;
  }, [focusOnMount]);
  return useRefEffect((node) => {
    if (focusOnMountRef.current === false) {
      return;
    }
    if (node.contains(node.ownerDocument?.activeElement ?? null)) {
      return;
    }
    if (focusOnMountRef.current !== "firstElement" && focusOnMountRef.current !== "firstInputElement") {
      setFocus(node);
      return;
    }
    const timerId = setTimeout(() => {
      if (focusOnMountRef.current === "firstInputElement") {
        const formInput = node.querySelector(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
        if (formInput) {
          setFocus(formInput);
          return;
        }
      }
      const firstTabbable = focus.tabbable.find(node)[0];
      if (firstTabbable) {
        setFocus(firstTabbable);
      }
    }, 0);
    return () => {
      clearTimeout(timerId);
    };
  }, []);
}
export {
  useFocusOnMount
};
//# sourceMappingURL=index.mjs.map
