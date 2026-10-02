// packages/data/src/select.ts
import defaultRegistry from "./default-registry.mjs";
function select(storeNameOrDescriptor) {
  return defaultRegistry.select(
    storeNameOrDescriptor
  );
}
export {
  select
};
//# sourceMappingURL=select.mjs.map
