// packages/components/src/context/context-connect.ts
import { forwardRef } from "@wordpress/element";
import warn from "@wordpress/warning";
import { CONNECT_STATIC_NAMESPACE } from "./constants.mjs";
import { getStyledClassNameFromKey } from "./get-styled-class-name-from-key.mjs";
function contextConnect(Component, namespace) {
  return _contextConnect(Component, namespace, {
    forwardsRef: true
  });
}
function contextConnectWithoutRef(Component, namespace) {
  return _contextConnect(Component, namespace);
}
function _contextConnect(Component, namespace, options) {
  const WrappedComponent = options?.forwardsRef ? forwardRef(Component) : Component;
  if (typeof namespace === "undefined") {
    globalThis.SCRIPT_DEBUG === true ? warn("contextConnect: Please provide a namespace") : void 0;
  }
  let mergedNamespace = WrappedComponent[CONNECT_STATIC_NAMESPACE] || [namespace];
  if (Array.isArray(namespace)) {
    mergedNamespace = [...mergedNamespace, ...namespace];
  }
  if (typeof namespace === "string") {
    mergedNamespace = [...mergedNamespace, namespace];
  }
  return Object.assign(WrappedComponent, {
    [CONNECT_STATIC_NAMESPACE]: [...new Set(mergedNamespace)],
    displayName: namespace,
    selector: `.${getStyledClassNameFromKey(namespace)}`
  });
}
function getConnectNamespace(Component) {
  if (!Component) {
    return [];
  }
  let namespaces = [];
  if (Component[CONNECT_STATIC_NAMESPACE]) {
    namespaces = Component[CONNECT_STATIC_NAMESPACE];
  }
  if (Component.type && Component.type[CONNECT_STATIC_NAMESPACE]) {
    namespaces = Component.type[CONNECT_STATIC_NAMESPACE];
  }
  return namespaces;
}
function hasConnectNamespace(Component, match) {
  if (!Component) {
    return false;
  }
  if (typeof match === "string") {
    return getConnectNamespace(Component).includes(match);
  }
  if (Array.isArray(match)) {
    return match.some((result) => getConnectNamespace(Component).includes(result));
  }
  return false;
}
export {
  contextConnect,
  contextConnectWithoutRef,
  getConnectNamespace,
  hasConnectNamespace
};
//# sourceMappingURL=context-connect.mjs.map
