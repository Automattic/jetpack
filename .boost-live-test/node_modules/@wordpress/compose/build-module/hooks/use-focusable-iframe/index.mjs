// packages/compose/src/hooks/use-focusable-iframe/index.ts
import useRefEffect from "../use-ref-effect/index.mjs";
function useFocusableIframe() {
  return useRefEffect((element) => {
    const { ownerDocument } = element;
    if (!ownerDocument) {
      return;
    }
    const { defaultView } = ownerDocument;
    if (!defaultView) {
      return;
    }
    function checkFocus() {
      if (ownerDocument && ownerDocument.activeElement === element) {
        element.focus();
      }
    }
    defaultView.addEventListener("blur", checkFocus);
    return () => {
      defaultView.removeEventListener("blur", checkFocus);
    };
  }, []);
}
export {
  useFocusableIframe as default
};
//# sourceMappingURL=index.mjs.map
