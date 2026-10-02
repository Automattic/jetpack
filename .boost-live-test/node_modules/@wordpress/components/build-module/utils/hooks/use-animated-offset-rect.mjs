// packages/components/src/utils/hooks/use-animated-offset-rect.ts
import { useEvent } from "@wordpress/compose";
import { useLayoutEffect } from "@wordpress/element";
import { useOnValueUpdate } from "./use-on-value-update.mjs";
function useAnimatedOffsetRect(container, rect, {
  prefix = "subelement",
  dataAttribute = `${prefix}-animated`,
  transitionEndFilter = () => true,
  roundRect = false
} = {}) {
  const setProperties = useEvent(() => {
    Object.keys(rect).forEach((property) => property !== "element" && container?.style.setProperty(`--${prefix}-${property}`, String(roundRect ? Math.floor(rect[property]) : rect[property])));
  });
  useLayoutEffect(() => {
    setProperties();
  }, [rect, setProperties]);
  useOnValueUpdate(rect.element, ({
    previousValue
  }) => {
    if (rect.element && previousValue) {
      container?.setAttribute(`data-${dataAttribute}`, "");
    }
  });
  useLayoutEffect(() => {
    function onTransitionEnd(event) {
      if (transitionEndFilter(event)) {
        container?.removeAttribute(`data-${dataAttribute}`);
      }
    }
    container?.addEventListener("transitionend", onTransitionEnd);
    return () => container?.removeEventListener("transitionend", onTransitionEnd);
  }, [dataAttribute, container, transitionEndFilter]);
}
export {
  useAnimatedOffsetRect
};
//# sourceMappingURL=use-animated-offset-rect.mjs.map
