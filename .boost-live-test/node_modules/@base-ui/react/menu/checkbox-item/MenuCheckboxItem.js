"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuCheckboxItem = void 0;
var React = _interopRequireWildcard(require("react"));
var _useControlled = require("@base-ui/utils/useControlled");
var _empty = require("@base-ui/utils/empty");
var _MenuCheckboxItemContext = require("./MenuCheckboxItemContext");
var _useMenuItem = require("../item/useMenuItem");
var _useCompositeListItem = require("../../internals/composite/list/useCompositeListItem");
var _MenuRootContext = require("../root/MenuRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _MenuPositionerContext = require("../positioner/MenuPositionerContext");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuCheckboxItem = exports.MenuCheckboxItem = /*#__PURE__*/React.forwardRef(function MenuCheckboxItem(componentProps, forwardedRef) {
  const {
    render,
    className,
    id: idProp,
    label,
    nativeButton = false,
    disabled: disabledProp = false,
    closeOnClick = false,
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    style,
    ...elementProps
  } = componentProps;
  const listItem = (0, _useCompositeListItem.useCompositeListItem)({
    guess: true,
    label
  });
  const menuPositionerContext = (0, _MenuPositionerContext.useMenuPositionerContext)(true);
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const {
    store
  } = (0, _MenuRootContext.useMenuRootContext)();
  const rootDisabled = store.useState('disabled');
  const disabled = disabledProp || rootDisabled;
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');
  const [checked, setChecked] = (0, _useControlled.useControlled)({
    controlled: checkedProp,
    default: defaultChecked ?? false,
    name: 'MenuCheckboxItem',
    state: 'checked'
  });
  const {
    getItemProps,
    itemRef
  } = (0, _useMenuItem.useMenuItem)({
    closeOnClick,
    disabled,
    highlighted,
    id,
    store,
    nativeButton,
    nodeId: menuPositionerContext?.context.nodeId,
    itemMetadata: _useMenuItem.REGULAR_ITEM
  });
  const state = React.useMemo(() => ({
    disabled,
    highlighted,
    checked
  }), [disabled, highlighted, checked]);
  function handleClick(event) {
    const details = (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.itemPress, event.nativeEvent, undefined, {
      preventUnmountOnClose: _empty.NOOP
    });
    onCheckedChange?.(!checked, details);
    if (details.isCanceled) {
      return;
    }
    setChecked(currentlyChecked => !currentlyChecked);
  }
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    stateAttributesMapping: _stateAttributesMapping.itemMapping,
    props: [itemProps, {
      role: 'menuitemcheckbox',
      'aria-checked': checked,
      onClick: handleClick
    }, elementProps, getItemProps],
    ref: [itemRef, forwardedRef, listItem.ref]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_MenuCheckboxItemContext.MenuCheckboxItemContext.Provider, {
    value: state,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") MenuCheckboxItem.displayName = "MenuCheckboxItem";