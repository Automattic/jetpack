"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToolbarRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _CompositeRoot = require("../../internals/composite/root/CompositeRoot");
var _ToolbarRootContext = require("./ToolbarRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A container for grouping a set of controls, such as buttons, toggle groups, or menus.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarRoot = exports.ToolbarRoot = /*#__PURE__*/React.forwardRef(function ToolbarRoot(componentProps, forwardedRef) {
  const {
    disabled = false,
    loopFocus,
    orientation = 'horizontal',
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const [itemMap, setItemMap] = React.useState(() => new Map());
  const disabledIndices = React.useMemo(() => {
    const output = [];
    for (const itemMetadata of itemMap.values()) {
      // Only items that are disabled and not focusable when disabled
      // are removed from roving focus.
      if (itemMetadata.disabled && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index);
      }
    }
    return output;
  }, [itemMap]);
  const toolbarRootContext = React.useMemo(() => ({
    disabled,
    orientation
  }), [disabled, orientation]);
  const state = {
    disabled,
    orientation
  };
  const defaultProps = {
    'aria-orientation': orientation,
    role: 'toolbar'
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ToolbarRootContext.ToolbarRootContext.Provider, {
    value: toolbarRootContext,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRoot.CompositeRoot, {
      render: render,
      className: className,
      style: style,
      state: state,
      refs: [forwardedRef],
      props: [defaultProps, elementProps],
      disabledIndices: disabledIndices,
      loopFocus: loopFocus,
      onMapChange: setItemMap,
      orientation: orientation
    })
  });
});
if (process.env.NODE_ENV !== "production") ToolbarRoot.displayName = "ToolbarRoot";