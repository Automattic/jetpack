// packages/rich-text/src/hook/use-anchor-ref.js
import { useMemo } from "@wordpress/element";
import deprecated from "@wordpress/deprecated";
import { getActiveFormat } from "../get-active-format.mjs";
function useAnchorRef({ ref, value, settings = {} }) {
  deprecated("`useAnchorRef` hook", {
    since: "6.1",
    alternative: "`useAnchor` hook"
  });
  const { tagName, className, name } = settings;
  const activeFormat = name ? getActiveFormat(value, name) : void 0;
  return useMemo(() => {
    if (!ref.current) {
      return;
    }
    const {
      ownerDocument: { defaultView }
    } = ref.current;
    const selection = defaultView.getSelection();
    if (!selection.rangeCount) {
      return;
    }
    const range = selection.getRangeAt(0);
    if (!activeFormat) {
      return range;
    }
    let element = range.startContainer;
    element = element.nextElementSibling || element;
    while (element.nodeType !== element.ELEMENT_NODE) {
      element = element.parentNode;
    }
    return element.closest(
      tagName + (className ? "." + className : "")
    );
  }, [activeFormat, value.start, value.end, tagName, className]);
}
export {
  useAnchorRef
};
//# sourceMappingURL=use-anchor-ref.mjs.map
