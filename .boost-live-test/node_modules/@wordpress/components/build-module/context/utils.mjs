// packages/components/src/context/utils.js
import { CONNECTED_NAMESPACE, COMPONENT_NAMESPACE } from "./constants.mjs";
function getNamespace(componentName) {
  return {
    [COMPONENT_NAMESPACE]: componentName
  };
}
function getConnectedNamespace() {
  return {
    [CONNECTED_NAMESPACE]: true
  };
}
export {
  getConnectedNamespace,
  getNamespace
};
//# sourceMappingURL=utils.mjs.map
