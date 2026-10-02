// packages/rich-text/src/apply-format.js
import { normaliseFormats } from "./normalise-formats.mjs";
function replace(array, index, value) {
  array = array.slice();
  array[index] = value;
  return array;
}
function applyFormat(value, format, startIndex = value.start, endIndex = value.end) {
  const { formats, activeFormats } = value;
  const newFormats = formats.slice();
  if (startIndex === endIndex) {
    const startFormat = newFormats[startIndex]?.find(
      ({ type }) => type === format.type
    );
    if (startFormat) {
      const index = newFormats[startIndex].indexOf(startFormat);
      while (newFormats[startIndex] && newFormats[startIndex][index] === startFormat) {
        newFormats[startIndex] = replace(
          newFormats[startIndex],
          index,
          format
        );
        startIndex--;
      }
      endIndex++;
      while (newFormats[endIndex] && newFormats[endIndex][index] === startFormat) {
        newFormats[endIndex] = replace(
          newFormats[endIndex],
          index,
          format
        );
        endIndex++;
      }
    }
  } else {
    let position = Infinity;
    for (let index = startIndex; index < endIndex; index++) {
      if (newFormats[index]) {
        newFormats[index] = newFormats[index].filter(
          ({ type }) => type !== format.type
        );
        const length = newFormats[index].length;
        if (length < position) {
          position = length;
        }
      } else {
        newFormats[index] = [];
        position = 0;
      }
    }
    for (let index = startIndex; index < endIndex; index++) {
      newFormats[index].splice(position, 0, format);
    }
  }
  return normaliseFormats({
    ...value,
    formats: newFormats,
    // Always revise active formats. This serves as a placeholder for new
    // inputs with the format so new input appears with the format applied,
    // and ensures a format of the same type uses the latest values.
    activeFormats: [
      ...activeFormats?.filter(
        ({ type }) => type !== format.type
      ) || [],
      format
    ]
  });
}
export {
  applyFormat
};
//# sourceMappingURL=apply-format.mjs.map
