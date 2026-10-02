"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverTitle = void 0;
var React = _interopRequireWildcard(require("react"));
var _PopoverRootContext = require("../root/PopoverRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
/**
 * A heading that labels the popover.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverTitle = exports.PopoverTitle = /*#__PURE__*/React.forwardRef(function PopoverTitle(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _PopoverRootContext.usePopoverRootContext)();
  const id = (0, _useBaseUiId.useBaseUiId)(elementProps.id);
  store.useSyncedValueWithCleanup('titleElementId', id);
  const element = (0, _useRenderElement.useRenderElement)('h2', componentProps, {
    ref: forwardedRef,
    props: [{
      id
    }, elementProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PopoverTitle.displayName = "PopoverTitle";