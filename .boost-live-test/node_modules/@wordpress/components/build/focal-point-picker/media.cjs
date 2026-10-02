"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/focal-point-picker/media.tsx
var media_exports = {};
__export(media_exports, {
  default: () => Media
});
module.exports = __toCommonJS(media_exports);
var import_focal_point_picker_style = require("./styles/focal-point-picker-style.cjs");
var import_utils = require("./utils.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_focal_point_picker_style.MediaPlaceholder, {
      className: "components-focal-point-picker__media components-focal-point-picker__media--placeholder",
      ref: mediaRef,
      ...props
    });
  }
  const isVideo = (0, import_utils.isVideoType)(src);
  return isVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
    ...props,
    autoPlay,
    className: "components-focal-point-picker__media components-focal-point-picker__media--video",
    loop: true,
    muted,
    onLoadedData: onLoad,
    ref: mediaRef,
    src
  }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
    ...props,
    alt,
    className: "components-focal-point-picker__media components-focal-point-picker__media--image",
    onLoad,
    ref: mediaRef,
    src
  });
}
//# sourceMappingURL=media.cjs.map
