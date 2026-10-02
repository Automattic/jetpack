// packages/components/src/snackbar/list.tsx
import clsx from "clsx";
import { useReducedMotion } from "@wordpress/compose";
import { useRef } from "@wordpress/element";
import Snackbar from "./index.mjs";
import { __unstableMotion as motion, __unstableAnimatePresence as AnimatePresence } from "../animation/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var SNACKBAR_VARIANTS = {
  init: {
    height: 0,
    opacity: 0
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        type: "tween",
        duration: 0.3,
        ease: [0, 0, 0.2, 1]
      },
      opacity: {
        type: "tween",
        duration: 0.25,
        delay: 0.05,
        ease: [0, 0, 0.2, 1]
      }
    }
  },
  exit: {
    opacity: 0,
    transition: {
      type: "tween",
      duration: 0.1,
      ease: [0, 0, 0.2, 1]
    }
  }
};
function SnackbarList({
  notices,
  className,
  children,
  onRemove
}) {
  const listRef = useRef(null);
  const isReducedMotion = useReducedMotion();
  className = clsx("components-snackbar-list", className);
  const removeNotice = (notice) => () => onRemove?.(notice.id);
  return /* @__PURE__ */ _jsxs("div", {
    className,
    tabIndex: -1,
    ref: listRef,
    "data-testid": "snackbar-list",
    children: [children, /* @__PURE__ */ _jsx(AnimatePresence, {
      children: notices.map((notice) => {
        const {
          content,
          ...restNotice
        } = notice;
        return /* @__PURE__ */ _jsx(motion.div, {
          layout: isReducedMotion ? false : "position",
          style: {
            width: "100%"
          },
          initial: "init",
          animate: "open",
          exit: "exit",
          variants: isReducedMotion ? void 0 : SNACKBAR_VARIANTS,
          children: /* @__PURE__ */ _jsx("div", {
            className: "components-snackbar-list__notice-container",
            children: /* @__PURE__ */ _jsx(Snackbar, {
              ...restNotice,
              onRemove: removeNotice(notice),
              listRef,
              children: notice.content
            })
          })
        }, notice.id);
      })
    })]
  });
}
var list_default = SnackbarList;
export {
  SnackbarList,
  list_default as default
};
//# sourceMappingURL=list.mjs.map
