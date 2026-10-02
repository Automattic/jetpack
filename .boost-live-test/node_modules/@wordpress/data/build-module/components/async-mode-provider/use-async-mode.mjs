// packages/data/src/components/async-mode-provider/use-async-mode.ts
import { useContext } from "@wordpress/element";
import { Context } from "./context.mjs";
function useAsyncMode() {
  return useContext(Context);
}
export {
  useAsyncMode as default
};
//# sourceMappingURL=use-async-mode.mjs.map
