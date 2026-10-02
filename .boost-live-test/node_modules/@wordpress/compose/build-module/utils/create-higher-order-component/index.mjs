// packages/compose/src/utils/create-higher-order-component/index.ts
import { pascalCase } from "change-case";
function createHigherOrderComponent(mapComponent, modifierName) {
  return (Inner) => {
    const Outer = mapComponent(Inner);
    Outer.displayName = hocName(modifierName, Inner);
    return Outer;
  };
}
var hocName = (name, Inner) => {
  const inner = Inner.displayName || Inner.name || "Component";
  const outer = pascalCase(name ?? "");
  return `${outer}(${inner})`;
};
export {
  createHigherOrderComponent
};
//# sourceMappingURL=index.mjs.map
