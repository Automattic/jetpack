"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/element/src/react.ts
var react_exports = {};
__export(react_exports, {
  Children: () => import_react.Children,
  Component: () => import_react.Component,
  Fragment: () => import_react.Fragment,
  PureComponent: () => import_react.PureComponent,
  StrictMode: () => import_react.StrictMode,
  Suspense: () => import_react.Suspense,
  cloneElement: () => import_react.cloneElement,
  concatChildren: () => concatChildren,
  createContext: () => import_react.createContext,
  createElement: () => import_react.createElement,
  createRef: () => import_react.createRef,
  forwardRef: () => import_react.forwardRef,
  isValidElement: () => import_react.isValidElement,
  lazy: () => import_react.lazy,
  memo: () => import_react.memo,
  startTransition: () => import_react.startTransition,
  switchChildrenNodeName: () => switchChildrenNodeName,
  useCallback: () => import_react.useCallback,
  useContext: () => import_react.useContext,
  useDebugValue: () => import_react.useDebugValue,
  useDeferredValue: () => import_react.useDeferredValue,
  useEffect: () => import_react.useEffect,
  useId: () => import_react.useId,
  useImperativeHandle: () => import_react.useImperativeHandle,
  useInsertionEffect: () => import_react.useInsertionEffect,
  useLayoutEffect: () => import_react.useLayoutEffect,
  useMemo: () => import_react.useMemo,
  useReducer: () => import_react.useReducer,
  useRef: () => import_react.useRef,
  useState: () => import_react.useState,
  useSyncExternalStore: () => import_react.useSyncExternalStore,
  useTransition: () => import_react.useTransition
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");
function concatChildren(...childrenArguments) {
  return childrenArguments.reduce(
    (accumulator, children, i) => {
      import_react.Children.forEach(children, (child, j) => {
        if ((0, import_react.isValidElement)(child) && typeof child !== "string") {
          child = (0, import_react.cloneElement)(child, {
            key: [i, j].join()
          });
        }
        accumulator.push(child);
      });
      return accumulator;
    },
    []
  );
}
function switchChildrenNodeName(children, nodeName) {
  return children && import_react.Children.map(children, (elt, index) => {
    if (typeof elt?.valueOf() === "string") {
      return (0, import_react.createElement)(nodeName, { key: index }, elt);
    }
    if (!(0, import_react.isValidElement)(elt)) {
      return elt;
    }
    const { children: childrenProp, ...props } = elt.props;
    return (0, import_react.createElement)(
      nodeName,
      { key: index, ...props },
      childrenProp
    );
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Children,
  Component,
  Fragment,
  PureComponent,
  StrictMode,
  Suspense,
  cloneElement,
  concatChildren,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  switchChildrenNodeName,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition
});
//# sourceMappingURL=react.cjs.map
