// packages/rich-text/src/remove-format.js
import { normaliseFormats } from "./normalise-formats.mjs";
function removeFormat(value, formatType, startIndex = value.start, endIndex = value.end) {
  const { formats, activeFormats } = value;
  const newFormats = formats.slice();
  if (startIndex === endIndex) {
    const format = newFormats[startIndex]?.find(
      ({ type }) => type === formatType
    );
    if (format) {
      while (newFormats[startIndex]?.find(
        (newFormat) => newFormat === format
      )) {
        filterFormats(newFormats, startIndex, formatType);
        startIndex--;
      }
      endIndex++;
      while (newFormats[endIndex]?.find(
        (newFormat) => newFormat === format
      )) {
        filterFormats(newFormats, endIndex, formatType);
        endIndex++;
      }
    }
  } else {
    for (let i = startIndex; i < endIndex; i++) {
      if (newFormats[i]) {
        filterFormats(newFormats, i, formatType);
      }
    }
  }
  return normaliseFormats({
    ...value,
    formats: newFormats,
    activeFormats: activeFormats?.filter(({ type }) => type !== formatType) || []
  });
}
function filterFormats(formats, index, formatType) {
  const newFormats = formats[index].filter(
    ({ type }) => type !== formatType
  );
  if (newFormats.length) {
    formats[index] = newFormats;
  } else {
    delete formats[index];
  }
}
export {
  removeFormat
};
//# sourceMappingURL=remove-format.mjs.map
