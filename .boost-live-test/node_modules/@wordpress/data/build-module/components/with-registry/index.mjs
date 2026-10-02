// packages/data/src/components/with-registry/index.tsx
import { createHigherOrderComponent } from "@wordpress/compose";
import { RegistryConsumer } from "../registry-provider/index.mjs";
import { jsx } from "react/jsx-runtime";
var withRegistry = createHigherOrderComponent(
  (OriginalComponent) => (props) => /* @__PURE__ */ jsx(RegistryConsumer, { children: (registry) => /* @__PURE__ */ jsx(OriginalComponent, { ...props, registry }) }),
  "withRegistry"
);
var with_registry_default = withRegistry;
export {
  with_registry_default as default
};
//# sourceMappingURL=index.mjs.map
