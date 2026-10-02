// packages/data/src/components/with-dispatch/index.tsx
import { createHigherOrderComponent } from "@wordpress/compose";
import { useDispatchWithMap } from "../use-dispatch/index.mjs";
import { jsx } from "react/jsx-runtime";
var withDispatch = (mapDispatchToProps) => createHigherOrderComponent(
  (WrappedComponent) => (ownProps) => {
    const mapDispatch = (dispatch, registry) => mapDispatchToProps(dispatch, ownProps, registry);
    const dispatchProps = useDispatchWithMap(mapDispatch, []);
    return /* @__PURE__ */ jsx(WrappedComponent, { ...ownProps, ...dispatchProps });
  },
  "withDispatch"
);
var with_dispatch_default = withDispatch;
export {
  with_dispatch_default as default
};
//# sourceMappingURL=index.mjs.map
