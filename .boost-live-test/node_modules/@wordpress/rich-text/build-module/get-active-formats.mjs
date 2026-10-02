// packages/rich-text/src/get-active-formats.js
import { isFormatEqual } from "./is-format-equal.mjs";
function getActiveFormats(value, EMPTY_ACTIVE_FORMATS = []) {
  const { formats, start, end, activeFormats } = value;
  if (start === void 0) {
    return EMPTY_ACTIVE_FORMATS;
  }
  if (start === end) {
    if (activeFormats) {
      return activeFormats;
    }
    const formatsBefore = formats[start - 1] || EMPTY_ACTIVE_FORMATS;
    const formatsAfter = formats[start] || EMPTY_ACTIVE_FORMATS;
    if (formatsBefore.length < formatsAfter.length) {
      return formatsBefore;
    }
    return formatsAfter;
  }
  if (!formats[start]) {
    return EMPTY_ACTIVE_FORMATS;
  }
  const selectedFormats = formats.slice(start, end);
  const _activeFormats = [...selectedFormats[0]];
  let i = selectedFormats.length;
  while (i--) {
    const formatsAtIndex = selectedFormats[i];
    if (!formatsAtIndex) {
      return EMPTY_ACTIVE_FORMATS;
    }
    let ii = _activeFormats.length;
    while (ii--) {
      const format = _activeFormats[ii];
      if (!formatsAtIndex.find(
        (_format) => isFormatEqual(format, _format)
      )) {
        _activeFormats.splice(ii, 1);
      }
    }
    if (_activeFormats.length === 0) {
      return EMPTY_ACTIVE_FORMATS;
    }
  }
  return _activeFormats || EMPTY_ACTIVE_FORMATS;
}
export {
  getActiveFormats
};
//# sourceMappingURL=get-active-formats.mjs.map
