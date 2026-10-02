// packages/components/src/focal-point-picker/media.tsx
import { MediaPlaceholder } from "./styles/focal-point-picker-style.mjs";
import { isVideoType } from "./utils.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function Media({
  alt,
  autoPlay,
  src,
  onLoad,
  mediaRef,
  // Exposing muted prop for test rendering purposes
  // https://github.com/testing-library/react-testing-library/issues/470
  muted = true,
  ...props
}) {
  if (!src) {
    return /* @__PURE__ */ _jsx(MediaPlaceholder, {
      className: "components-focal-point-picker__media components-focal-point-picker__media--placeholder",
      ref: mediaRef,
      ...props
    });
  }
  const isVideo = isVideoType(src);
  return isVideo ? /* @__PURE__ */ _jsx("video", {
    ...props,
    autoPlay,
    className: "components-focal-point-picker__media components-focal-point-picker__media--video",
    loop: true,
    muted,
    onLoadedData: onLoad,
    ref: mediaRef,
    src
  }) : /* @__PURE__ */ _jsx("img", {
    ...props,
    alt,
    className: "components-focal-point-picker__media components-focal-point-picker__media--image",
    onLoad,
    ref: mediaRef,
    src
  });
}
export {
  Media as default
};
//# sourceMappingURL=media.mjs.map
