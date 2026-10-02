// packages/data/src/components/registry-provider/context.ts
import { createContext } from "@wordpress/element";
import defaultRegistry from "../../default-registry.mjs";
var Context = createContext(defaultRegistry);
Context.displayName = "RegistryProviderContext";
var { Consumer, Provider } = Context;
var RegistryConsumer = Consumer;
var context_default = Provider;
export {
  Context,
  RegistryConsumer,
  context_default as default
};
//# sourceMappingURL=context.mjs.map
