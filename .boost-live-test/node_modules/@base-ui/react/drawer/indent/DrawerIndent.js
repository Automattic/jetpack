"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerIndent = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useRenderElement = require("../../internals/useRenderElement");
var _DrawerProviderContext = require("../provider/DrawerProviderContext");
var DrawerBackdropCssVars = _interopRequireWildcard(require("../backdrop/DrawerBackdropCssVars"));
var DrawerPopupCssVars = _interopRequireWildcard(require("../popup/DrawerPopupCssVars"));
const stateAttributesMapping = {
  active(value) {
    if (value) {
      return {
        'data-active': ''
      };
    }
    return {
      'data-inactive': ''
    };
  }
};

/**
 * A wrapper element intended to contain your app's main UI.
 * Applies `data-active` when any drawer within the nearest `<Drawer.Provider>` is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
const DrawerIndent = exports.DrawerIndent = /*#__PURE__*/React.forwardRef(function DrawerIndent(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const providerContext = (0, _DrawerProviderContext.useDrawerProviderContext)();
  const active = providerContext?.active ?? false;
  const visualStateStore = providerContext?.visualStateStore;
  const indentRef = React.useRef(null);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const element = indentRef.current;
    if (!element || !visualStateStore) {
      return undefined;
    }
    const syncVisualState = () => {
      const {
        swipeProgress,
        frontmostHeight
      } = visualStateStore.getSnapshot();
      if (swipeProgress <= 0) {
        element.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
      } else {
        element.style.setProperty(DrawerBackdropCssVars.swipeProgress, `${swipeProgress}`);
      }
      if (frontmostHeight <= 0) {
        element.style.removeProperty(DrawerPopupCssVars.height);
      } else {
        element.style.setProperty(DrawerPopupCssVars.height, `${frontmostHeight}px`);
      }
    };
    syncVisualState();
    const unsubscribe = visualStateStore.subscribe(syncVisualState);
    return () => {
      unsubscribe();
      element.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
      element.style.removeProperty(DrawerPopupCssVars.height);
    };
  }, [visualStateStore]);
  const state = {
    active
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, indentRef],
    state,
    props: [{
      style: {
        [DrawerBackdropCssVars.swipeProgress]: '0'
      }
    }, elementProps],
    stateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") DrawerIndent.displayName = "DrawerIndent";