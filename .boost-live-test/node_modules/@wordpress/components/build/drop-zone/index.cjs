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

// packages/components/src/drop-zone/index.tsx
var drop_zone_exports = {};
__export(drop_zone_exports, {
  DropZoneComponent: () => DropZoneComponent,
  default: () => drop_zone_default
});
module.exports = __toCommonJS(drop_zone_exports);
var import_clsx = __toESM(require("clsx"));
var import_i18n = require("@wordpress/i18n");
var import_element = require("@wordpress/element");
var import_icons = require("@wordpress/icons");
var import_dom = require("@wordpress/dom");
var import_compose = require("@wordpress/compose");
var import_jsx_runtime = require("react/jsx-runtime");
function DropZoneComponent({
  className,
  icon = import_icons.upload,
  label,
  onFilesDrop,
  onHTMLDrop,
  onDrop,
  isEligible = () => true,
  ...restProps
}) {
  const [isDraggingOverDocument, setIsDraggingOverDocument] = (0, import_element.useState)();
  const [isDraggingOverElement, setIsDraggingOverElement] = (0, import_element.useState)();
  const [isActive, setIsActive] = (0, import_element.useState)();
  const ref = (0, import_compose.__experimentalUseDropZone)({
    onDrop(event) {
      if (!event.dataTransfer) {
        return;
      }
      const files = (0, import_dom.getFilesFromDataTransfer)(event.dataTransfer);
      const html = event.dataTransfer.getData("text/html");
      if (html && onHTMLDrop) {
        onHTMLDrop(html);
      } else if (files.length && onFilesDrop) {
        onFilesDrop(files);
      } else if (onDrop) {
        onDrop(event);
      }
    },
    onDragStart(event) {
      setIsDraggingOverDocument(true);
      if (!event.dataTransfer) {
        return;
      }
      if (event.dataTransfer.types.includes("text/html")) {
        setIsActive(!!onHTMLDrop);
      } else if (
        // Check for the types because sometimes the files themselves
        // are only available on drop.
        event.dataTransfer.types.includes("Files") || (0, import_dom.getFilesFromDataTransfer)(event.dataTransfer).length > 0
      ) {
        setIsActive(!!onFilesDrop);
      } else {
        setIsActive(!!onDrop && isEligible(event.dataTransfer));
      }
    },
    onDragEnd() {
      setIsDraggingOverElement(false);
      setIsDraggingOverDocument(false);
      setIsActive(void 0);
    },
    onDragEnter() {
      setIsDraggingOverElement(true);
    },
    onDragLeave() {
      setIsDraggingOverElement(false);
    }
  });
  const classes = (0, import_clsx.default)("components-drop-zone", className, {
    "is-active": isActive,
    "is-dragging-over-document": isDraggingOverDocument,
    "is-dragging-over-element": isDraggingOverElement
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
    ...restProps,
    ref,
    className: classes,
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
      className: "components-drop-zone__content",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
        className: "components-drop-zone__content-inner",
        children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icons.Icon, {
          icon,
          className: "components-drop-zone__content-icon"
        }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
          className: "components-drop-zone__content-text",
          children: label ? label : (0, import_i18n.__)("Drop files to upload")
        })]
      })
    })
  });
}
var drop_zone_default = DropZoneComponent;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DropZoneComponent
});
//# sourceMappingURL=index.cjs.map
