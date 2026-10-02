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

// packages/components/src/navigator/navigator/component.tsx
var component_exports = {};
__export(component_exports, {
  Navigator: () => Navigator
});
module.exports = __toCommonJS(component_exports);
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_element = require("@wordpress/element");
var import_is_shallow_equal = require("@wordpress/is-shallow-equal");
var import_warning = __toESM(require("@wordpress/warning"));
var import_context = require("../../context/index.cjs");
var import_use_cx = require("../../utils/hooks/use-cx.cjs");
var import_router = require("../utils/router.cjs");
var import_view = require("../../view/index.cjs");
var import_context2 = require("../context.cjs");
var styles = __toESM(require("../styles.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function addScreen({
  screens
}, screen) {
  if (screens.some((s) => s.path === screen.path)) {
    globalThis.SCRIPT_DEBUG === true ? (0, import_warning.default)(`Navigator: a screen with path ${screen.path} already exists.
The screen with id ${screen.id} will not be added.`) : void 0;
    return screens;
  }
  return [...screens, screen];
}
function removeScreen({
  screens
}, screen) {
  return screens.filter((s) => s.id !== screen.id);
}
function goTo(state, path, options = {}) {
  const {
    focusSelectors
  } = state;
  const currentLocation = {
    ...state.currentLocation
  };
  const {
    // Default assignments
    isBack = false,
    skipFocus = false,
    // Extract to avoid forwarding
    replace,
    focusTargetSelector,
    // Rest
    ...restOptions
  } = options;
  if (currentLocation.path === path) {
    return {
      currentLocation,
      focusSelectors
    };
  }
  let focusSelectorsCopy;
  function getFocusSelectorsCopy() {
    focusSelectorsCopy = focusSelectorsCopy ?? new Map(state.focusSelectors);
    return focusSelectorsCopy;
  }
  if (focusTargetSelector && currentLocation.path) {
    getFocusSelectorsCopy().set(currentLocation.path, focusTargetSelector);
  }
  let currentFocusSelector;
  if (focusSelectors.get(path)) {
    if (isBack) {
      currentFocusSelector = focusSelectors.get(path);
    }
    getFocusSelectorsCopy().delete(path);
  }
  return {
    currentLocation: {
      ...restOptions,
      isInitial: false,
      path,
      isBack,
      hasRestoredFocus: false,
      focusTargetSelector: currentFocusSelector,
      skipFocus
    },
    focusSelectors: focusSelectorsCopy ?? focusSelectors
  };
}
function goToParent(state, options = {}) {
  const {
    screens,
    focusSelectors
  } = state;
  const currentLocation = {
    ...state.currentLocation
  };
  const currentPath = currentLocation.path;
  if (currentPath === void 0) {
    return {
      currentLocation,
      focusSelectors
    };
  }
  const parentPath = (0, import_router.findParent)(currentPath, screens);
  if (parentPath === void 0) {
    return {
      currentLocation,
      focusSelectors
    };
  }
  return goTo(state, parentPath, {
    ...options,
    isBack: true
  });
}
function routerReducer(state, action) {
  let {
    screens,
    currentLocation,
    matchedPath,
    focusSelectors,
    ...restState
  } = state;
  switch (action.type) {
    case "add":
      screens = addScreen(state, action.screen);
      break;
    case "remove":
      screens = removeScreen(state, action.screen);
      break;
    case "goto":
      ({
        currentLocation,
        focusSelectors
      } = goTo(state, action.path, action.options));
      break;
    case "gotoparent":
      ({
        currentLocation,
        focusSelectors
      } = goToParent(state, action.options));
      break;
  }
  if (screens === state.screens && currentLocation === state.currentLocation) {
    return state;
  }
  const currentPath = currentLocation.path;
  matchedPath = currentPath !== void 0 ? (0, import_router.patternMatch)(currentPath, screens) : void 0;
  if (matchedPath && state.matchedPath && matchedPath.id === state.matchedPath.id && (0, import_is_shallow_equal.isShallowEqual)(matchedPath.params, state.matchedPath.params)) {
    matchedPath = state.matchedPath;
  }
  return {
    ...restState,
    screens,
    currentLocation,
    matchedPath,
    focusSelectors
  };
}
function UnconnectedNavigator(props, forwardedRef) {
  const {
    initialPath: initialPathProp,
    children,
    className,
    ...otherProps
  } = (0, import_context.useContextSystem)(props, "Navigator");
  const [routerState, dispatch] = (0, import_element.useReducer)(routerReducer, initialPathProp, (path) => ({
    screens: [],
    currentLocation: {
      path,
      isInitial: true
    },
    matchedPath: void 0,
    focusSelectors: /* @__PURE__ */ new Map(),
    initialPath: initialPathProp
  }));
  const methods = (0, import_element.useMemo)(() => ({
    // Note: calling goBack calls `goToParent` internally, as it was established
    // that `goBack` should behave like `goToParent`, and `goToParent` should
    // be marked as deprecated.
    goBack: (options) => dispatch({
      type: "gotoparent",
      options
    }),
    goTo: (path, options) => dispatch({
      type: "goto",
      path,
      options
    }),
    goToParent: (options) => {
      (0, import_deprecated.default)(`wp.components.useNavigator().goToParent`, {
        since: "6.7",
        alternative: "wp.components.useNavigator().goBack"
      });
      dispatch({
        type: "gotoparent",
        options
      });
    },
    addScreen: (screen) => dispatch({
      type: "add",
      screen
    }),
    removeScreen: (screen) => dispatch({
      type: "remove",
      screen
    })
  }), []);
  const {
    currentLocation,
    matchedPath
  } = routerState;
  const navigatorContextValue = (0, import_element.useMemo)(() => ({
    location: currentLocation,
    params: matchedPath?.params ?? {},
    match: matchedPath?.id,
    ...methods
  }), [currentLocation, matchedPath, methods]);
  const cx = (0, import_use_cx.useCx)();
  const classes = (0, import_element.useMemo)(() => cx(styles.navigatorWrapper, className), [className, cx]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_view.View, {
    ref: forwardedRef,
    className: classes,
    ...otherProps,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_context2.NavigatorContext.Provider, {
      value: navigatorContextValue,
      children
    })
  });
}
var Navigator = (0, import_context.contextConnect)(UnconnectedNavigator, "Navigator");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Navigator
});
//# sourceMappingURL=component.cjs.map
