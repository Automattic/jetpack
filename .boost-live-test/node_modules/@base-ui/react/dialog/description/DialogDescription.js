"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogDescription = void 0;
var React = _interopRequireWildcard(require("react"));
var _DialogRootContext = require("../root/DialogRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
/**
 * A paragraph with additional information about the dialog.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogDescription = exports.DialogDescription = /*#__PURE__*/React.forwardRef(function DialogDescription(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  store.useSyncedValueWithCleanup('descriptionElementId', id);
  return (0, _useRenderElement.useRenderElement)('p', componentProps, {
    ref: forwardedRef,
    props: [{
      id
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DialogDescription.displayName = "DialogDescription";