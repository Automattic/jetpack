"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuGroupLabel = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _MenuGroupContext = require("../group/MenuGroupContext");
/**
 * An accessible label that is automatically associated with its parent group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuGroupLabel = exports.MenuGroupLabel = /*#__PURE__*/React.forwardRef(function MenuGroupLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const setLabelId = (0, _MenuGroupContext.useMenuGroupRootContext)();
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    setLabelId(id);
    return () => {
      setLabelId(currentId => currentId === id ? undefined : currentId);
    };
  }, [setLabelId, id]);
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: {
      id,
      'aria-hidden': true,
      ...elementProps
    }
  });
});
if (process.env.NODE_ENV !== "production") MenuGroupLabel.displayName = "MenuGroupLabel";