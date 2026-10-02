// packages/components/src/navigator/navigator/component.tsx
import deprecated from "@wordpress/deprecated";
import { useMemo, useReducer } from "@wordpress/element";
import { isShallowEqual } from "@wordpress/is-shallow-equal";
import warning from "@wordpress/warning";
import { contextConnect, useContextSystem } from "../../context/index.mjs";
import { useCx } from "../../utils/hooks/use-cx.mjs";
import { patternMatch, findParent } from "../utils/router.mjs";
import { View } from "../../view/index.mjs";
import { NavigatorContext } from "../context.mjs";
import * as styles from "../styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function addScreen({
  screens
}, screen) {
  if (screens.some((s) => s.path === screen.path)) {
    globalThis.SCRIPT_DEBUG === true ? warning(`Navigator: a screen with path ${screen.path} already exists.
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
  const parentPath = findParent(currentPath, screens);
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
  matchedPath = currentPath !== void 0 ? patternMatch(currentPath, screens) : void 0;
  if (matchedPath && state.matchedPath && matchedPath.id === state.matchedPath.id && isShallowEqual(matchedPath.params, state.matchedPath.params)) {
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
  } = useContextSystem(props, "Navigator");
  const [routerState, dispatch] = useReducer(routerReducer, initialPathProp, (path) => ({
    screens: [],
    currentLocation: {
      path,
      isInitial: true
    },
    matchedPath: void 0,
    focusSelectors: /* @__PURE__ */ new Map(),
    initialPath: initialPathProp
  }));
  const methods = useMemo(() => ({
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
      deprecated(`wp.components.useNavigator().goToParent`, {
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
  const navigatorContextValue = useMemo(() => ({
    location: currentLocation,
    params: matchedPath?.params ?? {},
    match: matchedPath?.id,
    ...methods
  }), [currentLocation, matchedPath, methods]);
  const cx = useCx();
  const classes = useMemo(() => cx(styles.navigatorWrapper, className), [className, cx]);
  return /* @__PURE__ */ _jsx(View, {
    ref: forwardedRef,
    className: classes,
    ...otherProps,
    children: /* @__PURE__ */ _jsx(NavigatorContext.Provider, {
      value: navigatorContextValue,
      children
    })
  });
}
var Navigator = contextConnect(UnconnectedNavigator, "Navigator");
export {
  Navigator
};
//# sourceMappingURL=component.mjs.map
