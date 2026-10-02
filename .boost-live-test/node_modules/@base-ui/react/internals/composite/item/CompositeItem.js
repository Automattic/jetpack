"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompositeItem = CompositeItem;
var _empty = require("@base-ui/utils/empty");
var _useRenderElement = require("../../useRenderElement");
var _useCompositeItem = require("./useCompositeItem");
function CompositeItem(componentProps) {
  const {
    render,
    className,
    style,
    state = _empty.EMPTY_OBJECT,
    props = _empty.EMPTY_ARRAY,
    refs = _empty.EMPTY_ARRAY,
    metadata,
    stateAttributesMapping,
    tag = 'div',
    ...elementProps
  } = componentProps;
  const {
    compositeProps,
    compositeRef
  } = (0, _useCompositeItem.useCompositeItem)({
    metadata
  });
  return (0, _useRenderElement.useRenderElement)(tag, componentProps, {
    state,
    // The composite ref attaches first so an outer item wins when nested items share a DOM node.
    ref: [compositeRef, ...refs],
    props: [compositeProps, ...props, elementProps],
    stateAttributesMapping
  });
}