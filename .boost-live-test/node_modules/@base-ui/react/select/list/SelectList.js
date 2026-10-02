"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectList = void 0;
var React = _interopRequireWildcard(require("react"));
var _SelectRootContext = require("../root/SelectRootContext");
var _SelectPositionerContext = require("../positioner/SelectPositionerContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _styles = require("../../utils/styles");
var _utils = require("../popup/utils");
/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectList = exports.SelectList = /*#__PURE__*/React.forwardRef(function SelectList(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const {
    multiple,
    readOnly
  } = (0, _SelectRootContext.useSelectRootPropsContext)();
  const {
    alignItemWithTriggerActive
  } = (0, _SelectPositionerContext.useSelectPositionerContext)();
  const hasScrollArrows = store.useState('hasScrollArrows');
  const openMethod = store.useState('openMethod');
  const id = store.useState('id');
  const defaultProps = {
    id: `${id}-list`,
    role: 'listbox',
    'aria-multiselectable': multiple || undefined,
    'aria-readonly': readOnly || undefined,
    onScroll(event) {
      store.context.scrollHandlerRef.current?.(event.currentTarget);
    },
    ...(alignItemWithTriggerActive && {
      style: _utils.LIST_FUNCTIONAL_STYLES
    }),
    className: hasScrollArrows && openMethod !== 'touch' ? _styles.styleDisableScrollbar.className : undefined
  };
  const setListElement = store.useStateSetter('listElement');
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [defaultProps, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") SelectList.displayName = "SelectList";