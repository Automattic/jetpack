// packages/compose/src/higher-order/with-instance-id/index.tsx
import { createHigherOrderComponent } from "../../utils/create-higher-order-component/index.mjs";
import useInstanceId from "../../hooks/use-instance-id/index.mjs";
import { jsx } from "react/jsx-runtime";
var withInstanceId = createHigherOrderComponent(
  (WrappedComponent) => {
    return (props) => {
      const instanceId = useInstanceId(WrappedComponent);
      return /* @__PURE__ */ jsx(WrappedComponent, { ...props, instanceId });
    };
  },
  "instanceId"
);
var with_instance_id_default = withInstanceId;
export {
  with_instance_id_default as default
};
//# sourceMappingURL=index.mjs.map
