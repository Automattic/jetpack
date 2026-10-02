// packages/components/src/focal-point-picker/utils.ts
var INITIAL_BOUNDS = {
  width: 200,
  height: 170
};
var VIDEO_EXTENSIONS = ["avi", "mpg", "mpeg", "mov", "mp4", "m4v", "ogg", "ogv", "webm", "wmv"];
function getExtension(filename = "") {
  const parts = filename.split(".");
  return parts[parts.length - 1];
}
function isVideoType(filename = "") {
  if (!filename) {
    return false;
  }
  return filename.startsWith("data:video/") || VIDEO_EXTENSIONS.includes(getExtension(filename));
}
function fractionToPercentage(fraction) {
  return Math.round(fraction * 100);
}
export {
  INITIAL_BOUNDS,
  fractionToPercentage,
  getExtension,
  isVideoType
};
//# sourceMappingURL=utils.mjs.map
