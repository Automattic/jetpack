"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ContextMenuRoot = ContextMenuRoot;
var React = _interopRequireWildcard(require("react"));
var _useId = require("@base-ui/utils/useId");
var _ContextMenuRootContext = require("./ContextMenuRootContext");
var _menu = require("../../menu");
var _MenuRootContext = require("../../menu/root/MenuRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
function ContextMenuRoot(props) {
  const [anchor, setAnchor] = React.useState({
    getBoundingClientRect() {
      return DOMRect.fromRect({
        width: 0,
        height: 0,
        x: 0,
        y: 0
      });
    }
  });
  const backdropRef = React.useRef(null);
  const internalBackdropRef = React.useRef(null);
  const actionsRef = React.useRef(null);
  const positionerRef = React.useRef(null);
  const allowMouseUpTriggerRef = React.useRef(true);
  const initialCursorPointRef = React.useRef(null);
  const id = (0, _useId.useId)();
  const contextValue = React.useMemo(() => ({
    anchor,
    setAnchor,
    actionsRef,
    backdropRef,
    internalBackdropRef,
    positionerRef,
    allowMouseUpTriggerRef,
    initialCursorPointRef,
    rootId: id
  }), [anchor, id]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ContextMenuRootContext.ContextMenuRootContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_MenuRootContext.MenuRootContext.Provider, {
      value: undefined,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_menu.Menu.Root, {
        ...props
      })
    })
  });
}