"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useToastLabelElement = useToastLabelElement;
exports.useToastLabelPart = useToastLabelPart;
var _useId = require("@base-ui/utils/useId");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _ToastRootContext = require("../root/ToastRootContext");
var _isRenderableNode = require("./isRenderableNode");
/**
 * Shared logic for `Toast.Title` and `Toast.Description`, which only differ by the rendered tag,
 * the fallback content, and which id setter they register with. Resolves the content and returns
 * the pieces each part passes to `useRenderElement` and `useToastLabelElement`.
 */
function useToastLabelPart(idProp, childrenProp, part) {
  const {
    toast,
    setTitleId,
    setDescriptionId
  } = (0, _ToastRootContext.useToastRootContext)();
  const setId = part === 'title' ? setTitleId : setDescriptionId;
  const children = childrenProp ?? (part === 'title' ? toast.title : toast.description);
  const id = (0, _useId.useId)(idProp);
  return {
    id,
    children,
    type: toast.type,
    setId
  };
}

/**
 * Mounts the evaluated label element only when it carries renderable content (so a `render` prop's
 * own children count, while a childless styling-only `render` stays conditional), registering the
 * generated id with the root while the part renders.
 */
function useToastLabelElement(element, id, setId) {
  const shouldRender = (0, _isRenderableNode.hasRenderableChildren)(element);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!shouldRender) {
      return undefined;
    }
    setId(id);
    return () => {
      setId(currentId => currentId === id ? undefined : currentId);
    };
  }, [shouldRender, id, setId]);
  return shouldRender ? element : null;
}