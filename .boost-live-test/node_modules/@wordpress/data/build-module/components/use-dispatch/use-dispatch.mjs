// packages/data/src/components/use-dispatch/use-dispatch.ts
import useRegistry from "../registry-provider/use-registry.mjs";
var useDispatch = (storeNameOrDescriptor) => {
  const { dispatch } = useRegistry();
  return storeNameOrDescriptor === void 0 ? dispatch : dispatch(storeNameOrDescriptor);
};
var use_dispatch_default = useDispatch;
export {
  use_dispatch_default as default
};
//# sourceMappingURL=use-dispatch.mjs.map
