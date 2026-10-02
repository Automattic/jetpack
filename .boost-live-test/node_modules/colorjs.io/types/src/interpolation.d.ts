/**
 * Return an intermediate color between two colors
 * @overload
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {MixOptions} [options]
 * @returns {PlainColorObject}
 */
export function mix(c1: ColorTypes, c2: ColorTypes, options?: MixOptions): PlainColorObject;
/**
 * @overload
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {number} [p=0.5]
 * @param {MixOptions} [options]
 * @returns {PlainColorObject}
 */
export function mix(c1: ColorTypes, c2: ColorTypes, p?: number, options?: MixOptions): PlainColorObject;
/**
 * Get an array of discrete steps
 * @overload
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {StepsOptions} [options]
 * @returns {PlainColorObject[]}
 */
export function steps(c1: ColorTypes, c2: ColorTypes, options?: StepsOptions): PlainColorObject[];
/**
 * @overload
 * @param {Range} range
 * @param {StepsOptions} [options]
 * @returns {PlainColorObject[]}
 */
export function steps(range: Range, options?: StepsOptions): PlainColorObject[];
/**
 * Creates a function that accepts a number and returns a color.
 * For numbers in the range 0 to 1, the function interpolates;
 * for numbers outside that range, the function extrapolates
 * (and thus may not return the results you expect)
 * @overload
 * @param {Range} range
 * @param {RangeOptions} [options]
 * @returns {Range}
 */
export function range(range: Range, options?: RangeOptions): Range;
/**
 * @overload
 * @param {ColorTypes} color1
 * @param {ColorTypes} color2
 * @param {RangeOptions & Record<string, any>} [options]
 * @returns {Range}
 */
export function range(color1: ColorTypes, color2: ColorTypes, options?: RangeOptions & Record<string, any>): Range;
/**
 * @param {any} val
 * @returns {val is Range}
 */
export function isRange(val: any): val is Range;
/**
 * @param {typeof import("./color.js").default} Color
 */
export function register(Color: typeof import("./color.js").default): void;
export type MixOptions = import("./types.js").MixOptions;
export type Range = import("./types.js").Range;
export type RangeOptions = import("./types.js").RangeOptions;
export type StepsOptions = import("./types.js").StepsOptions;
import type { ColorTypes } from "./types.js";
import type { PlainColorObject } from "./types.js";
//# sourceMappingURL=interpolation.d.ts.map