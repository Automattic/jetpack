// packages/data/src/components/registry-provider/use-registry.ts
import { useContext } from "@wordpress/element";
import { Context } from "./context.mjs";
function useRegistry() {
  return useContext(Context);
}
export {
  useRegistry as default
};
//# sourceMappingURL=use-registry.mjs.map
