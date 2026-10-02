"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Menubar = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../floating-ui-react");
var _MenubarContext = require("./MenubarContext");
var _CompositeRoot = require("../internals/composite/root/CompositeRoot");
var _useBaseUiId = require("../internals/useBaseUiId");
var MenubarDataAttributes = _interopRequireWildcard(require("./MenubarDataAttributes"));
var _reasons = require("../internals/reasons");
var _jsxRuntime = require("react/jsx-runtime");
const menubarStateAttributesMapping = {
  hasSubmenuOpen(value) {
    return value ? {
      [MenubarDataAttributes.hasSubmenuOpen]: ''
    } : null;
  }
};

/**
 * The container for menus.
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
const Menubar = exports.Menubar = /*#__PURE__*/React.forwardRef(function Menubar(props, forwardedRef) {
  const {
    orientation = 'horizontal',
    loopFocus = true,
    render,
    className,
    modal = true,
    disabled = false,
    id: idProp,
    style,
    ...elementProps
  } = props;
  const [contentElement, setContentElement] = React.useState(null);
  const [hasSubmenuOpen, setHasSubmenuOpen] = React.useState(false);
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const state = {
    orientation,
    modal,
    hasSubmenuOpen
  };
  const contentRef = React.useRef(null);
  const allowMouseUpTriggerRef = React.useRef(false);
  const context = React.useMemo(() => ({
    contentElement,
    setContentElement,
    setHasSubmenuOpen,
    hasSubmenuOpen,
    modal,
    disabled,
    orientation,
    allowMouseUpTriggerRef,
    rootId: id
  }), [contentElement, hasSubmenuOpen, modal, disabled, orientation, id]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_MenubarContext.MenubarContext.Provider, {
    value: context,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingTree, {
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(MenubarContent, {
        children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRoot.CompositeRoot, {
          render: render,
          className: className,
          style: style,
          state: state,
          stateAttributesMapping: menubarStateAttributesMapping,
          refs: [forwardedRef, setContentElement, contentRef],
          props: [{
            role: 'menubar',
            id,
            'aria-orientation': orientation
          }, elementProps],
          orientation: orientation,
          loopFocus: loopFocus,
          enableHomeAndEndKeys: true,
          highlightItemOnHover: hasSubmenuOpen
        })
      })
    })
  });
});
if (process.env.NODE_ENV !== "production") Menubar.displayName = "Menubar";
function MenubarContent(props) {
  const nodeId = (0, _floatingUiReact.useFloatingNodeId)();
  const {
    events: menuEvents
  } = (0, _floatingUiReact.useFloatingTree)();
  const rootContext = (0, _MenubarContext.useMenubarContext)();
  React.useEffect(() => {
    function onSubmenuOpenChange(details) {
      if (!details.nodeId || details.parentNodeId !== nodeId) {
        return;
      }
      if (details.open) {
        if (!rootContext.hasSubmenuOpen) {
          rootContext.setHasSubmenuOpen(true);
        }
      } else if (details.reason !== _reasons.REASONS.siblingOpen && details.reason !== _reasons.REASONS.listNavigation) {
        rootContext.setHasSubmenuOpen(false);
      }
    }
    menuEvents.on('menuopenchange', onSubmenuOpenChange);
    return () => {
      menuEvents.off('menuopenchange', onSubmenuOpenChange);
    };
  }, [menuEvents, nodeId, rootContext]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingNode, {
    id: nodeId,
    children: props.children
  });
}