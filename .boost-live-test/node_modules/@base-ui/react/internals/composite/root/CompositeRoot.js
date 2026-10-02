"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompositeRoot = CompositeRoot;
var React = _interopRequireWildcard(require("react"));
var _empty = require("@base-ui/utils/empty");
var _CompositeList = require("../list/CompositeList");
var _useCompositeRoot = require("./useCompositeRoot");
var _CompositeRootContext = require("./CompositeRootContext");
var _useRenderElement = require("../../useRenderElement");
var _DirectionContext = require("../../direction-context/DirectionContext");
var _jsxRuntime = require("react/jsx-runtime");
function CompositeRoot(componentProps) {
  const {
    render,
    className,
    style,
    refs = _empty.EMPTY_ARRAY,
    props = _empty.EMPTY_ARRAY,
    state = _empty.EMPTY_OBJECT,
    stateAttributesMapping,
    highlightedIndex: highlightedIndexProp,
    onHighlightedIndexChange: onHighlightedIndexChangeProp,
    orientation,
    grid,
    loopFocus,
    onLoop,
    enableHomeAndEndKeys,
    onMapChange: onMapChangeProp,
    stopEventPropagation = true,
    rootRef,
    disabledIndices,
    modifierKeys,
    highlightItemOnHover = false,
    tag = 'div',
    ...elementProps
  } = componentProps;
  const direction = (0, _DirectionContext.useDirection)();
  const {
    props: defaultProps,
    highlightedIndex,
    onHighlightedIndexChange,
    elementsRef,
    onMapChange: onMapChangeUnwrapped,
    relayKeyboardEvent
  } = (0, _useCompositeRoot.useCompositeRoot)({
    grid,
    loopFocus,
    onLoop,
    orientation,
    highlightedIndex: highlightedIndexProp,
    onHighlightedIndexChange: onHighlightedIndexChangeProp,
    rootRef,
    stopEventPropagation,
    enableHomeAndEndKeys,
    direction,
    disabledIndices,
    modifierKeys
  });
  const element = (0, _useRenderElement.useRenderElement)(tag, componentProps, {
    state,
    ref: refs,
    props: [defaultProps, ...props, elementProps],
    stateAttributesMapping
  });
  const contextValue = React.useMemo(() => ({
    highlightedIndex,
    onHighlightedIndexChange,
    highlightItemOnHover,
    relayKeyboardEvent
  }), [highlightedIndex, onHighlightedIndexChange, highlightItemOnHover, relayKeyboardEvent]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeRootContext.CompositeRootContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeList.CompositeList, {
      elementsRef: elementsRef,
      onMapChange: newMap => {
        onMapChangeProp?.(newMap);
        onMapChangeUnwrapped(newMap);
      },
      children: element
    })
  });
}