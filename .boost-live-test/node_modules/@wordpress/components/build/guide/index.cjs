"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/guide/index.tsx
var guide_exports = {};
__export(guide_exports, {
  default: () => guide_default
});
module.exports = __toCommonJS(guide_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_i18n = require("@wordpress/i18n");
var import_modal = __toESM(require("../modal/index.cjs"));
var import_button = __toESM(require("../button/index.cjs"));
var import_page_control = __toESM(require("./page-control.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function Guide({
  children,
  className,
  contentLabel,
  finishButtonText = (0, import_i18n.__)("Finish"),
  nextButtonText = (0, import_i18n.__)("Next"),
  previousButtonText = (0, import_i18n.__)("Previous"),
  onFinish,
  pages = []
}) {
  const ref = (0, import_element.useRef)(null);
  const [currentPage, setCurrentPage] = (0, import_element.useState)(0);
  (0, import_element.useEffect)(() => {
    const frame = ref.current?.querySelector(".components-guide");
    if (frame instanceof HTMLElement) {
      frame.focus();
    }
  }, [currentPage]);
  (0, import_element.useEffect)(() => {
    if (import_element.Children.count(children)) {
      (0, import_deprecated.default)("Passing children to <Guide>", {
        since: "5.5",
        alternative: "the `pages` prop"
      });
    }
  }, [children]);
  if (import_element.Children.count(children)) {
    pages = import_element.Children.map(children, (child) => ({
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_modal.default, {
    className: (0, import_clsx.default)("components-guide", className),
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
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
      className: "components-guide__container",
      children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
        className: "components-guide__page",
        children: [pages[currentPage].image, pages.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_page_control.default, {
          currentPage,
          numberOfPages: pages.length,
          setCurrentPage
        }), pages[currentPage].content]
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
        className: "components-guide__footer",
        children: [canGoBack && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
          className: "components-guide__back-button",
          variant: "tertiary",
          onClick: goBack,
          __next40pxDefaultSize: true,
          children: previousButtonText
        }), canGoForward && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
          className: "components-guide__forward-button",
          variant: "primary",
          onClick: goForward,
          __next40pxDefaultSize: true,
          children: nextButtonText
        }), !canGoForward && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
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
//# sourceMappingURL=index.cjs.map
