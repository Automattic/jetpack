import { clamp } from '@base-ui/utils/clamp';
import { asc } from "./asc.mjs";
export function getSliderValue(valueInput, index, min, max, range, values) {
  const clamped = clamp(valueInput, min, max);
  if (!range) {
    return clamped;
  }
  const output = values.slice();
  // Bound the new value to the thumb's neighbours.
  output[index] = clamp(clamped, values[index - 1] ?? -Infinity, values[index + 1] ?? Infinity);
  return output.sort(asc);
}