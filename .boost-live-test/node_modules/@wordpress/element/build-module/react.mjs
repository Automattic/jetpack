// packages/element/src/react.ts
import {
  Children,
  cloneElement,
  Component,
  createContext,
  createElement,
  createRef,
  forwardRef,
  Fragment,
  isValidElement,
  memo,
  PureComponent,
  StrictMode,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  startTransition,
  lazy,
  Suspense
} from "react";
function concatChildren(...childrenArguments) {
  return childrenArguments.reduce(
    (accumulator, children, i) => {
      Children.forEach(children, (child, j) => {
        if (isValidElement(child) && typeof child !== "string") {
          child = cloneElement(child, {
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
  return children && Children.map(children, (elt, index) => {
    if (typeof elt?.valueOf() === "string") {
      return createElement(nodeName, { key: index }, elt);
    }
    if (!isValidElement(elt)) {
      return elt;
    }
    const { children: childrenProp, ...props } = elt.props;
    return createElement(
      nodeName,
      { key: index, ...props },
      childrenProp
    );
  });
}
export {
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
};
//# sourceMappingURL=react.mjs.map
