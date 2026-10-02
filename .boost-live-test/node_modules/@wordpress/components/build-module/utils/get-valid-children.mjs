// packages/components/src/utils/get-valid-children.ts
import { Children, isValidElement } from "@wordpress/element";
function getValidChildren(children) {
  if (typeof children === "string") {
    return [children];
  }
  return Children.toArray(children).filter((child) => isValidElement(child));
}
export {
  getValidChildren
};
//# sourceMappingURL=get-valid-children.mjs.map
