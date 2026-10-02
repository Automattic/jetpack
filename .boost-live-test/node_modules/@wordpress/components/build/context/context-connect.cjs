"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/context/context-connect.ts
var context_connect_exports = {};
__export(context_connect_exports, {
  contextConnect: () => contextConnect,
  contextConnectWithoutRef: () => contextConnectWithoutRef,
  getConnectNamespace: () => getConnectNamespace,
  hasConnectNamespace: () => hasConnectNamespace
});
module.exports = __toCommonJS(context_connect_exports);
var import_element = require("@wordpress/element");
var import_warning = __toESM(require("@wordpress/warning"));
var import_constants = require("./constants.cjs");
var import_get_styled_class_name_from_key = require("./get-styled-class-name-from-key.cjs");
function contextConnect(Component, namespace) {
  return _contextConnect(Component, namespace, {
    forwardsRef: true
  });
}
function contextConnectWithoutRef(Component, namespace) {
  return _contextConnect(Component, namespace);
}
function _contextConnect(Component, namespace, options) {
  const WrappedComponent = options?.forwardsRef ? (0, import_element.forwardRef)(Component) : Component;
  if (typeof namespace === "undefined") {
    globalThis.SCRIPT_DEBUG === true ? (0, import_warning.default)("contextConnect: Please provide a namespace") : void 0;
  }
  let mergedNamespace = WrappedComponent[import_constants.CONNECT_STATIC_NAMESPACE] || [namespace];
  if (Array.isArray(namespace)) {
    mergedNamespace = [...mergedNamespace, ...namespace];
  }
  if (typeof namespace === "string") {
    mergedNamespace = [...mergedNamespace, namespace];
  }
  return Object.assign(WrappedComponent, {
    [import_constants.CONNECT_STATIC_NAMESPACE]: [...new Set(mergedNamespace)],
    displayName: namespace,
    selector: `.${(0, import_get_styled_class_name_from_key.getStyledClassNameFromKey)(namespace)}`
  });
}
function getConnectNamespace(Component) {
  if (!Component) {
    return [];
  }
  let namespaces = [];
  if (Component[import_constants.CONNECT_STATIC_NAMESPACE]) {
    namespaces = Component[import_constants.CONNECT_STATIC_NAMESPACE];
  }
  if (Component.type && Component.type[import_constants.CONNECT_STATIC_NAMESPACE]) {
    namespaces = Component.type[import_constants.CONNECT_STATIC_NAMESPACE];
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  contextConnect,
  contextConnectWithoutRef,
  getConnectNamespace,
  hasConnectNamespace
});
//# sourceMappingURL=context-connect.cjs.map
