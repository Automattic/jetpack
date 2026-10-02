"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AccordionItem = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _useCollapsibleRoot = require("../../collapsible/root/useCollapsibleRoot");
var _CollapsibleRootContext = require("../../collapsible/root/CollapsibleRootContext");
var _useCompositeListItem = require("../../internals/composite/list/useCompositeListItem");
var _AccordionRootContext = require("../root/AccordionRootContext");
var _AccordionItemContext = require("./AccordionItemContext");
var _stateAttributesMapping = require("./stateAttributesMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups an accordion header with the corresponding panel.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
const AccordionItem = exports.AccordionItem = /*#__PURE__*/React.forwardRef(function AccordionItem(componentProps, forwardedRef) {
  const {
    className,
    disabled: disabledProp = false,
    onOpenChange: onOpenChangeProp,
    render,
    value: valueProp,
    style,
    ...elementProps
  } = componentProps;
  const {
    ref: listItemRef,
    index
  } = (0, _useCompositeListItem.useCompositeListItem)();
  const mergedRef = (0, _useMergedRefs.useMergedRefs)(forwardedRef, listItemRef);
  const {
    disabled: contextDisabled,
    handleValueChange,
    state: rootState,
    value: openValues
  } = (0, _AccordionRootContext.useAccordionRootContext)();
  const fallbackValue = (0, _useBaseUiId.useBaseUiId)();
  const value = valueProp ?? fallbackValue;
  const disabled = disabledProp || contextDisabled;
  const isOpen = openValues.indexOf(value) !== -1;
  const onOpenChange = (0, _useStableCallback.useStableCallback)((nextOpen, eventDetails) => {
    onOpenChangeProp?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    handleValueChange(value, nextOpen, eventDetails);
  });
  const collapsible = (0, _useCollapsibleRoot.useCollapsibleRoot)({
    open: isOpen,
    onOpenChange,
    disabled
  });
  const collapsibleState = React.useMemo(() => ({
    open: collapsible.open,
    disabled: collapsible.disabled,
    transitionStatus: collapsible.transitionStatus
  }), [collapsible.open, collapsible.disabled, collapsible.transitionStatus]);
  const collapsibleContext = React.useMemo(() => ({
    ...collapsible,
    onOpenChange,
    state: collapsibleState
  }), [collapsible, collapsibleState, onOpenChange]);
  const state = React.useMemo(() => ({
    ...rootState,
    hidden: !isOpen && !collapsible.mounted,
    index,
    disabled,
    open: isOpen
  }), [collapsible.mounted, disabled, index, isOpen, rootState]);
  const defaultTriggerId = (0, _useBaseUiId.useBaseUiId)();
  // `undefined` uses the initial generated fallback; `null` means the trigger unmounted.
  const [registeredTriggerId, setTriggerId] = React.useState();
  const triggerId = registeredTriggerId === null ? undefined : registeredTriggerId ?? defaultTriggerId;
  const accordionItemContext = React.useMemo(() => ({
    defaultTriggerId,
    open: isOpen,
    state,
    setTriggerId,
    triggerId
  }), [defaultTriggerId, isOpen, state, setTriggerId, triggerId]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: mergedRef,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.accordionStateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CollapsibleRootContext.CollapsibleRootContext.Provider, {
    value: collapsibleContext,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_AccordionItemContext.AccordionItemContext.Provider, {
      value: accordionItemContext,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") AccordionItem.displayName = "AccordionItem";