// packages/components/src/popover/overlay-middlewares.tsx
import { size } from "@floating-ui/react-dom";
function overlayMiddlewares() {
  return [{
    name: "overlay",
    fn({
      rects
    }) {
      return rects.reference;
    }
  }, size({
    apply({
      rects,
      elements
    }) {
      const {
        firstElementChild
      } = elements.floating ?? {};
      if (!(firstElementChild instanceof HTMLElement)) {
        return;
      }
      Object.assign(firstElementChild.style, {
        width: `${rects.reference.width}px`,
        height: `${rects.reference.height}px`
      });
    }
  })];
}
export {
  overlayMiddlewares
};
//# sourceMappingURL=overlay-middlewares.mjs.map
