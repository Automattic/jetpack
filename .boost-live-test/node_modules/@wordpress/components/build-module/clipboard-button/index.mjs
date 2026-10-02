// packages/components/src/clipboard-button/index.tsx
import clsx from "clsx";
import { useRef, useEffect } from "@wordpress/element";
import { useCopyToClipboard } from "@wordpress/compose";
import deprecated from "@wordpress/deprecated";
import Button from "../button/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var TIMEOUT = 4e3;
function ClipboardButton({
  className,
  children,
  onCopy,
  onFinishCopy,
  text,
  ...buttonProps
}) {
  deprecated("wp.components.ClipboardButton", {
    since: "5.8",
    alternative: "wp.compose.useCopyToClipboard"
  });
  const timeoutIdRef = useRef(void 0);
  const ref = useCopyToClipboard(text, () => {
    onCopy();
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (onFinishCopy) {
      timeoutIdRef.current = setTimeout(() => onFinishCopy(), TIMEOUT);
    }
  });
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);
  const classes = clsx("components-clipboard-button", className);
  const focusOnCopyEventTarget = (event) => {
    event.target.focus();
  };
  return (
    // Disable reasons: the parent component takes care of the __next40pxDefaultSize prop.
    // eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
    /* @__PURE__ */ _jsx(Button, {
      ...buttonProps,
      className: classes,
      ref,
      onCopy: focusOnCopyEventTarget,
      children
    })
  );
}
export {
  ClipboardButton as default
};
//# sourceMappingURL=index.mjs.map
