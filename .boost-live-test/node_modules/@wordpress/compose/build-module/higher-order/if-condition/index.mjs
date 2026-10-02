// packages/compose/src/higher-order/if-condition/index.tsx
import { createHigherOrderComponent } from "../../utils/create-higher-order-component/index.mjs";
import { jsx } from "react/jsx-runtime";
function ifCondition(predicate) {
  return createHigherOrderComponent(
    (WrappedComponent) => (props) => {
      if (!predicate(props)) {
        return null;
      }
      return /* @__PURE__ */ jsx(WrappedComponent, { ...props });
    },
    "ifCondition"
  );
}
var if_condition_default = ifCondition;
export {
  if_condition_default as default
};
//# sourceMappingURL=index.mjs.map
