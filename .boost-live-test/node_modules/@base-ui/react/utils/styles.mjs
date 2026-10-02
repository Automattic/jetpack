import { jsx as _jsx } from "react/jsx-runtime";
const DISABLE_SCROLLBAR_CLASS_NAME = 'base-ui-disable-scrollbar';
export const styleDisableScrollbar = {
  className: DISABLE_SCROLLBAR_CLASS_NAME,
  getElement(nonce) {
    return /*#__PURE__*/_jsx("style", {
      nonce: nonce,
      href: DISABLE_SCROLLBAR_CLASS_NAME,
      precedence: "base-ui:low",
      children: `.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`
    });
  }
};
if (process.env.NODE_ENV !== "production") styleDisableScrollbar.getElement.displayName = "styleDisableScrollbar.getElement";