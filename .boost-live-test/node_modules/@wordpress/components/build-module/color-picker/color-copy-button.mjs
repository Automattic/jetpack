// packages/components/src/color-picker/color-copy-button.tsx
import { useCopyToClipboard } from "@wordpress/compose";
import { useState, useEffect, useRef } from "@wordpress/element";
import { copy, check } from "@wordpress/icons";
import { __ } from "@wordpress/i18n";
import { Button } from "../button/index.mjs";
import Tooltip from "../tooltip/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var ColorCopyButton = (props) => {
  const {
    color,
    colorType
  } = props;
  const [copiedColor, setCopiedColor] = useState(null);
  const copyTimerRef = useRef(void 0);
  const copyRef = useCopyToClipboard(() => {
    switch (colorType) {
      case "hsl": {
        return color.toHslString();
      }
      case "rgb": {
        return color.toRgbString();
      }
      default:
      case "hex": {
        return color.toHex();
      }
    }
  }, () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }
    setCopiedColor(color.toHex());
    copyTimerRef.current = setTimeout(() => {
      setCopiedColor(null);
      copyTimerRef.current = void 0;
    }, 3e3);
  });
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);
  const isCopied = copiedColor === color.toHex();
  const label = isCopied ? __("Copied!") : __("Copy");
  return /* @__PURE__ */ _jsx(Tooltip, {
    delay: 0,
    hideOnClick: false,
    text: label,
    children: /* @__PURE__ */ _jsx(Button, {
      size: "compact",
      "aria-label": label,
      ref: copyRef,
      icon: isCopied ? check : copy,
      showTooltip: false
    })
  });
};
export {
  ColorCopyButton
};
//# sourceMappingURL=color-copy-button.mjs.map
