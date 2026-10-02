"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AccordionHeader = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _AccordionItemContext = require("../item/AccordionItemContext");
var _stateAttributesMapping = require("../item/stateAttributesMapping");
/**
 * A heading that labels the corresponding panel.
 * Renders an `<h3>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
const AccordionHeader = exports.AccordionHeader = /*#__PURE__*/React.forwardRef(function AccordionHeader(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = (0, _AccordionItemContext.useAccordionItemContext)();
  const element = (0, _useRenderElement.useRenderElement)('h3', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.accordionStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") AccordionHeader.displayName = "AccordionHeader";