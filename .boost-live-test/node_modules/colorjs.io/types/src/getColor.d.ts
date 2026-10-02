/**
 * Resolves a color reference (object or string) to a plain color object
 * @overload
 * @param {ColorTypes} color
 * @param {GetColorOptions} [options]
 * @returns {PlainColorObject}
 */
export default function getColor(color: ColorTypes, options?: GetColorOptions): PlainColorObject;
/**
 * @overload
 * @param {ColorTypes[]} color
 * @param {GetColorOptions} [options]
 * @returns {PlainColorObject[]}
 */
export default function getColor(color: ColorTypes[], options?: GetColorOptions): PlainColorObject[];
import type { ColorTypes } from "./types.js";
import type { ParseOptions as GetColorOptions } from "./types.js";
import type { PlainColorObject } from "./types.js";
//# sourceMappingURL=getColor.d.ts.map