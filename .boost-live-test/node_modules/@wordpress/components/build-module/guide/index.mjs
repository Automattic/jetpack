// packages/components/src/guide/index.tsx
import clsx from "clsx";
import { useState, useEffect, Children, useRef } from "@wordpress/element";
import deprecated from "@wordpress/deprecated";
import { __ } from "@wordpress/i18n";
import Modal from "../modal/index.mjs";
import Button from "../button/index.mjs";
import PageControl from "./page-control.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function Guide({
  children,
  className,
  contentLabel,
  finishButtonText = __("Finish"),
  nextButtonText = __("Next"),
  previousButtonText = __("Previous"),
  onFinish,
  pages = []
}) {
  const ref = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  useEffect(() => {
    const frame = ref.current?.querySelector(".components-guide");
    if (frame instanceof HTMLElement) {
      frame.focus();
    }
  }, [currentPage]);
  useEffect(() => {
    if (Children.count(children)) {
      deprecated("Passing children to <Guide>", {
        since: "5.5",
        alternative: "the `pages` prop"
      });
    }
  }, [children]);
  if (Children.count(children)) {
    pages = Children.map(children, (child) => ({
      content: child
    })) ?? [];
  }
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < pages.length - 1;
  const goBack = () => {
    if (canGoBack) {
      setCurrentPage(currentPage - 1);
    }
  };
  const goForward = () => {
    if (canGoForward) {
      setCurrentPage(currentPage + 1);
    }
  };
  if (pages.length === 0) {
    return null;
  }
  return /* @__PURE__ */ _jsx(Modal, {
    className: clsx("components-guide", className),
    contentLabel,
    isDismissible: pages.length > 1,
    onRequestClose: onFinish,
    onKeyDown: (event) => {
      if (event.code === "ArrowLeft") {
        goBack();
        event.preventDefault();
      } else if (event.code === "ArrowRight") {
        goForward();
        event.preventDefault();
      }
    },
    ref,
    children: /* @__PURE__ */ _jsxs("div", {
      className: "components-guide__container",
      children: [/* @__PURE__ */ _jsxs("div", {
        className: "components-guide__page",
        children: [pages[currentPage].image, pages.length > 1 && /* @__PURE__ */ _jsx(PageControl, {
          currentPage,
          numberOfPages: pages.length,
          setCurrentPage
        }), pages[currentPage].content]
      }), /* @__PURE__ */ _jsxs("div", {
        className: "components-guide__footer",
        children: [canGoBack && /* @__PURE__ */ _jsx(Button, {
          className: "components-guide__back-button",
          variant: "tertiary",
          onClick: goBack,
          __next40pxDefaultSize: true,
          children: previousButtonText
        }), canGoForward && /* @__PURE__ */ _jsx(Button, {
          className: "components-guide__forward-button",
          variant: "primary",
          onClick: goForward,
          __next40pxDefaultSize: true,
          children: nextButtonText
        }), !canGoForward && /* @__PURE__ */ _jsx(Button, {
          className: "components-guide__finish-button",
          variant: "primary",
          onClick: onFinish,
          __next40pxDefaultSize: true,
          children: finishButtonText
        })]
      })]
    })
  });
}
var guide_default = Guide;
export {
  guide_default as default
};
//# sourceMappingURL=index.mjs.map
