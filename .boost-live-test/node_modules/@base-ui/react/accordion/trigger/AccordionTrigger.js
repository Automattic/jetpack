"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AccordionTrigger = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _collapsibleOpenStateMapping = require("../../utils/collapsibleOpenStateMapping");
var _useButton = require("../../internals/use-button");
var _CollapsibleRootContext = require("../../collapsible/root/CollapsibleRootContext");
var _AccordionItemContext = require("../item/AccordionItemContext");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * A button that opens and closes the corresponding panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */

const AccordionTrigger = exports.AccordionTrigger = /*#__PURE__*/React.forwardRef(function AccordionTrigger(componentProps, forwardedRef) {
  const {
    disabled: disabledProp,
    className,
    id: idProp,
    render,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;
  const {
    panelId,
    open,
    handleTrigger,
    disabled: contextDisabled
  } = (0, _CollapsibleRootContext.useCollapsibleRootContext)();
  const disabled = disabledProp || contextDisabled;
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton
  });
  const {
    defaultTriggerId,
    state,
    setTriggerId
  } = (0, _AccordionItemContext.useAccordionItemContext)();
  const registeredId = idProp || undefined;
  const id = registeredId ?? defaultTriggerId;
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setTriggerId(currentId => registeredId ?? (currentId === null ? undefined : currentId));
    return () => {
      setTriggerId(currentId => currentId === registeredId ? null : currentId);
    };
  }, [registeredId, setTriggerId]);
  const props = {
    'aria-controls': open ? panelId : undefined,
    'aria-expanded': open,
    id,
    onClick: handleTrigger
  };
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, elementProps, getButtonProps],
    stateAttributesMapping: _collapsibleOpenStateMapping.triggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") AccordionTrigger.displayName = "AccordionTrigger";