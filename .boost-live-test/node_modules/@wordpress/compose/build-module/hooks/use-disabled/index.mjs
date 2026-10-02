// packages/compose/src/hooks/use-disabled/index.ts
import { debounce } from "../../utils/debounce/index.mjs";
import useRefEffect from "../use-ref-effect/index.mjs";
function useDisabled({
  isDisabled: isDisabledProp = false
} = {}) {
  return useRefEffect(
    (node) => {
      if (isDisabledProp) {
        return;
      }
      const defaultView = node?.ownerDocument?.defaultView;
      if (!defaultView) {
        return;
      }
      const updates = [];
      const disable = () => {
        node.childNodes.forEach((child) => {
          if (!(child instanceof defaultView.HTMLElement)) {
            return;
          }
          if (!child.getAttribute("inert")) {
            child.setAttribute("inert", "true");
            updates.push(() => {
              child.removeAttribute("inert");
            });
          }
        });
      };
      const debouncedDisable = debounce(disable, 0, {
        leading: true
      });
      disable();
      const observer = new window.MutationObserver(debouncedDisable);
      observer.observe(node, {
        childList: true
      });
      return () => {
        if (observer) {
          observer.disconnect();
        }
        debouncedDisable.cancel();
        updates.forEach((update) => update());
      };
    },
    [isDisabledProp]
  );
}
export {
  useDisabled as default
};
//# sourceMappingURL=index.mjs.map
