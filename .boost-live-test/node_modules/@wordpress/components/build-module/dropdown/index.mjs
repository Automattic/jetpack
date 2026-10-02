// packages/components/src/dropdown/index.tsx
import clsx from "clsx";
import { useRef, useState } from "@wordpress/element";
import { useMergeRefs } from "@wordpress/compose";
import deprecated from "@wordpress/deprecated";
import { contextConnect, useContextSystem } from "../context/index.mjs";
import { useControlledValue } from "../utils/hooks/index.mjs";
import Popover from "../popover/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var UnconnectedDropdown = (props, forwardedRef) => {
  const {
    renderContent,
    renderToggle,
    className,
    contentClassName,
    expandOnMobile,
    headerTitle,
    focusOnMount,
    popoverProps,
    onClose,
    onToggle,
    style,
    open,
    defaultOpen,
    // Deprecated props
    position,
    // From context system
    variant
  } = useContextSystem(props, "Dropdown");
  if (position !== void 0) {
    deprecated("`position` prop in wp.components.Dropdown", {
      since: "6.2",
      alternative: "`popoverProps.placement` prop",
      hint: "Note that the `position` prop will override any values passed through the `popoverProps.placement` prop."
    });
  }
  const [fallbackPopoverAnchor, setFallbackPopoverAnchor] = useState(null);
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useControlledValue({
    defaultValue: defaultOpen,
    value: open,
    onChange: onToggle
  });
  function closeIfFocusOutside() {
    if (!containerRef.current) {
      return;
    }
    const {
      ownerDocument
    } = containerRef.current;
    const dialog = ownerDocument?.activeElement?.closest('[role="dialog"]');
    if (!containerRef.current.contains(ownerDocument.activeElement) && (!dialog || dialog.contains(containerRef.current))) {
      close();
    }
  }
  function close() {
    onClose?.();
    setIsOpen(false);
  }
  const args = {
    isOpen: !!isOpen,
    onToggle: () => setIsOpen(!isOpen),
    onClose: close
  };
  const popoverPropsHaveAnchor = !!popoverProps?.anchor || // Note: `anchorRef`, `getAnchorRect` and `anchorRect` are deprecated and
  // be removed from `Popover` from WordPress 6.3
  !!popoverProps?.anchorRef || !!popoverProps?.getAnchorRect || !!popoverProps?.anchorRect;
  return /* @__PURE__ */ _jsxs("div", {
    className,
    ref: useMergeRefs([containerRef, forwardedRef, setFallbackPopoverAnchor]),
    tabIndex: -1,
    style,
    children: [renderToggle(args), isOpen && /* @__PURE__ */ _jsx(Popover, {
      position,
      onClose: close,
      onFocusOutside: closeIfFocusOutside,
      expandOnMobile,
      headerTitle,
      focusOnMount,
      offset: 13,
      anchor: !popoverPropsHaveAnchor ? fallbackPopoverAnchor : void 0,
      variant,
      ...popoverProps,
      className: clsx("components-dropdown__content", popoverProps?.className, contentClassName),
      children: renderContent(args)
    })]
  });
};
var Dropdown = contextConnect(UnconnectedDropdown, "Dropdown");
var dropdown_default = Dropdown;
export {
  Dropdown,
  dropdown_default as default
};
//# sourceMappingURL=index.mjs.map
