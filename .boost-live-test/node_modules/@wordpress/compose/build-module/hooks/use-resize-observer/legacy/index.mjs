// packages/compose/src/hooks/use-resize-observer/legacy/index.tsx
import { useCallback, useRef, useState } from "@wordpress/element";
import { useResizeObserver } from "../use-resize-observer.mjs";
import { jsx } from "react/jsx-runtime";
var extractSize = (entry) => {
  let entrySize;
  if (!entry.contentBoxSize) {
    entrySize = [entry.contentRect.width, entry.contentRect.height];
  } else if (entry.contentBoxSize[0]) {
    const contentBoxSize = entry.contentBoxSize[0];
    entrySize = [contentBoxSize.inlineSize, contentBoxSize.blockSize];
  } else {
    const contentBoxSize = entry.contentBoxSize;
    entrySize = [contentBoxSize.inlineSize, contentBoxSize.blockSize];
  }
  const [width, height] = entrySize.map((d) => Math.round(d));
  return { width, height };
};
var RESIZE_ELEMENT_STYLES = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: "none",
  opacity: 0,
  overflow: "hidden",
  zIndex: -1
};
function ResizeElement({ onResize }) {
  const resizeElementRef = useResizeObserver((entries) => {
    const newSize = extractSize(entries.at(-1));
    onResize(newSize);
  });
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: resizeElementRef,
      style: RESIZE_ELEMENT_STYLES,
      "aria-hidden": "true"
    }
  );
}
function sizeEquals(a, b) {
  return a.width === b.width && a.height === b.height;
}
var NULL_SIZE = { width: null, height: null };
function useLegacyResizeObserver() {
  const [size, setSize] = useState(NULL_SIZE);
  const previousSizeRef = useRef(NULL_SIZE);
  const handleResize = useCallback((newSize) => {
    if (!sizeEquals(previousSizeRef.current, newSize)) {
      previousSizeRef.current = newSize;
      setSize(newSize);
    }
  }, []);
  const resizeElement = /* @__PURE__ */ jsx(ResizeElement, { onResize: handleResize });
  return [resizeElement, size];
}
export {
  useLegacyResizeObserver as default
};
//# sourceMappingURL=index.mjs.map
