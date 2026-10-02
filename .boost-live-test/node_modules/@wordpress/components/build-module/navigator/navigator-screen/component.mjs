// packages/components/src/navigator/navigator-screen/component.tsx
import { focus } from "@wordpress/dom";
import { useContext, useEffect, useMemo, useRef, useId } from "@wordpress/element";
import { useMergeRefs } from "@wordpress/compose";
import { escapeAttribute } from "@wordpress/escape-html";
import warning from "@wordpress/warning";
import { contextConnect, useContextSystem } from "../../context/index.mjs";
import { useCx } from "../../utils/hooks/use-cx.mjs";
import { View } from "../../view/index.mjs";
import { NavigatorContext } from "../context.mjs";
import * as styles from "../styles.mjs";
import { useScreenAnimatePresence } from "./use-screen-animate-presence.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedNavigatorScreen(props, forwardedRef) {
  if (!/^\//.test(props.path)) {
    globalThis.SCRIPT_DEBUG === true ? warning("wp.components.Navigator.Screen: the `path` should follow a URL-like scheme; it should start with and be separated by the `/` character.") : void 0;
  }
  const screenId = useId();
  const {
    children,
    className,
    path,
    onAnimationEnd: onAnimationEndProp,
    ...otherProps
  } = useContextSystem(props, "Navigator.Screen");
  const {
    location,
    match,
    addScreen,
    removeScreen
  } = useContext(NavigatorContext);
  const {
    isInitial,
    isBack,
    focusTargetSelector,
    skipFocus
  } = location;
  const isMatch = match === screenId;
  const wrapperRef = useRef(null);
  const skipAnimationAndFocusRestoration = !!isInitial && !isBack;
  useEffect(() => {
    const screen = {
      id: screenId,
      path: escapeAttribute(path)
    };
    addScreen(screen);
    return () => removeScreen(screen);
  }, [screenId, path, addScreen, removeScreen]);
  const {
    animationStyles,
    shouldRenderScreen,
    screenProps
  } = useScreenAnimatePresence({
    isMatch,
    isBack,
    onAnimationEnd: onAnimationEndProp,
    skipAnimation: skipAnimationAndFocusRestoration
  });
  const cx = useCx();
  const classes = useMemo(() => cx(styles.navigatorScreen, animationStyles, className), [className, cx, animationStyles]);
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  useEffect(() => {
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
      const [firstTabbable] = focus.tabbable.find(wrapperEl);
      elementToFocus = firstTabbable ?? wrapperEl;
    }
    locationRef.current.hasRestoredFocus = true;
    elementToFocus.focus();
  }, [skipAnimationAndFocusRestoration, isMatch, isBack, focusTargetSelector, skipFocus]);
  const mergedWrapperRef = useMergeRefs([forwardedRef, wrapperRef]);
  return shouldRenderScreen ? /* @__PURE__ */ _jsx(View, {
    ref: mergedWrapperRef,
    className: classes,
    ...screenProps,
    ...otherProps,
    children
  }) : null;
}
var NavigatorScreen = contextConnect(UnconnectedNavigatorScreen, "Navigator.Screen");
export {
  NavigatorScreen
};
//# sourceMappingURL=component.mjs.map
