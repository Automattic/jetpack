"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogTitle = void 0;
var React = _interopRequireWildcard(require("react"));
var _DialogRootContext = require("../root/DialogRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
/**
 * A heading that labels the dialog.
 * Renders an `<h2>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogTitle = exports.DialogTitle = /*#__PURE__*/React.forwardRef(function DialogTitle(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  store.useSyncedValueWithCleanup('titleElementId', id);
  return (0, _useRenderElement.useRenderElement)('h2', componentProps, {
    ref: forwardedRef,
    props: [{
      id
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DialogTitle.displayName = "DialogTitle";