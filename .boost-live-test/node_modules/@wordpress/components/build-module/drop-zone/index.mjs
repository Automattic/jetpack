// packages/components/src/drop-zone/index.tsx
import clsx from "clsx";
import { __ } from "@wordpress/i18n";
import { useState } from "@wordpress/element";
import { upload, Icon } from "@wordpress/icons";
import { getFilesFromDataTransfer } from "@wordpress/dom";
import { __experimentalUseDropZone as useDropZone } from "@wordpress/compose";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function DropZoneComponent({
  className,
  icon = upload,
  label,
  onFilesDrop,
  onHTMLDrop,
  onDrop,
  isEligible = () => true,
  ...restProps
}) {
  const [isDraggingOverDocument, setIsDraggingOverDocument] = useState();
  const [isDraggingOverElement, setIsDraggingOverElement] = useState();
  const [isActive, setIsActive] = useState();
  const ref = useDropZone({
    onDrop(event) {
      if (!event.dataTransfer) {
        return;
      }
      const files = getFilesFromDataTransfer(event.dataTransfer);
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
        event.dataTransfer.types.includes("Files") || getFilesFromDataTransfer(event.dataTransfer).length > 0
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
  const classes = clsx("components-drop-zone", className, {
    "is-active": isActive,
    "is-dragging-over-document": isDraggingOverDocument,
    "is-dragging-over-element": isDraggingOverElement
  });
  return /* @__PURE__ */ _jsx("div", {
    ...restProps,
    ref,
    className: classes,
    children: /* @__PURE__ */ _jsx("div", {
      className: "components-drop-zone__content",
      children: /* @__PURE__ */ _jsxs("div", {
        className: "components-drop-zone__content-inner",
        children: [/* @__PURE__ */ _jsx(Icon, {
          icon,
          className: "components-drop-zone__content-icon"
        }), /* @__PURE__ */ _jsx("span", {
          className: "components-drop-zone__content-text",
          children: label ? label : __("Drop files to upload")
        })]
      })
    })
  });
}
var drop_zone_default = DropZoneComponent;
export {
  DropZoneComponent,
  drop_zone_default as default
};
//# sourceMappingURL=index.mjs.map
