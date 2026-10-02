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

// packages/components/src/navigator/navigator-screen/component.tsx
var component_exports = {};
__export(component_exports, {
  NavigatorScreen: () => NavigatorScreen
});
module.exports = __toCommonJS(component_exports);
var import_dom = require("@wordpress/dom");
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_escape_html = require("@wordpress/escape-html");
var import_warning = __toESM(require("@wordpress/warning"));
var import_context = require("../../context/index.cjs");
var import_use_cx = require("../../utils/hooks/use-cx.cjs");
var import_view = require("../../view/index.cjs");
var import_context2 = require("../context.cjs");
var styles = __toESM(require("../styles.cjs"));
var import_use_screen_animate_presence = require("./use-screen-animate-presence.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnconnectedNavigatorScreen(props, forwardedRef) {
  if (!/^\//.test(props.path)) {
    globalThis.SCRIPT_DEBUG === true ? (0, import_warning.default)("wp.components.Navigator.Screen: the `path` should follow a URL-like scheme; it should start with and be separated by the `/` character.") : void 0;
  }
  const screenId = (0, import_element.useId)();
  const {
    children,
    className,
    path,
    onAnimationEnd: onAnimationEndProp,
    ...otherProps
  } = (0, import_context.useContextSystem)(props, "Navigator.Screen");
  const {
    location,
    match,
    addScreen,
    removeScreen
  } = (0, import_element.useContext)(import_context2.NavigatorContext);
  const {
    isInitial,
    isBack,
    focusTargetSelector,
    skipFocus
  } = location;
  const isMatch = match === screenId;
  const wrapperRef = (0, import_element.useRef)(null);
  const skipAnimationAndFocusRestoration = !!isInitial && !isBack;
  (0, import_element.useEffect)(() => {
    const screen = {
      id: screenId,
      path: (0, import_escape_html.escapeAttribute)(path)
    };
    addScreen(screen);
    return () => removeScreen(screen);
  }, [screenId, path, addScreen, removeScreen]);
  const {
    animationStyles,
    shouldRenderScreen,
    screenProps
  } = (0, import_use_screen_animate_presence.useScreenAnimatePresence)({
    isMatch,
    isBack,
    onAnimationEnd: onAnimationEndProp,
    skipAnimation: skipAnimationAndFocusRestoration
  });
  const cx = (0, import_use_cx.useCx)();
  const classes = (0, import_element.useMemo)(() => cx(styles.navigatorScreen, animationStyles, className), [className, cx, animationStyles]);
  const locationRef = (0, import_element.useRef)(location);
  (0, import_element.useEffect)(() => {
    locationRef.current = location;
  }, [location]);
  (0, import_element.useEffect)(() => {
    const wrapperEl = wrapperRef.current;
    if (skipAnimationAndFocusRestoration || !isMatch || !wrapperEl || locationRef.current.hasRestoredFocus || skipFocus) {
      return;
    }
    const activeElement = wrapperEl.ownerDocument.activeElement;
    if (wrapperEl.contains(activeElement)) {
      return;
    }
    let elementToFocus = null;
    if (isBack && focusTargetSelector) {
      elementToFocus = wrapperEl.querySelector(focusTargetSelector);
    }
    if (!elementToFocus) {
      const [firstTabbable] = import_dom.focus.tabbable.find(wrapperEl);
      elementToFocus = firstTabbable ?? wrapperEl;
    }
    locationRef.current.hasRestoredFocus = true;
    elementToFocus.focus();
  }, [skipAnimationAndFocusRestoration, isMatch, isBack, focusTargetSelector, skipFocus]);
  const mergedWrapperRef = (0, import_compose.useMergeRefs)([forwardedRef, wrapperRef]);
  return shouldRenderScreen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_view.View, {
    ref: mergedWrapperRef,
    className: classes,
    ...screenProps,
    ...otherProps,
    children
  }) : null;
}
var NavigatorScreen = (0, import_context.contextConnect)(UnconnectedNavigatorScreen, "Navigator.Screen");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NavigatorScreen
});
//# sourceMappingURL=component.cjs.map
