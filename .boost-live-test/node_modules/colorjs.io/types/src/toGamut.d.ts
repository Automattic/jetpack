/**
 * Force coordinates to be in gamut of a certain color space.
 * Mutates the color it is passed.
 * @overload
 * @param {ColorTypes} color
 * @param {ToGamutOptions} [options]
 * @returns {PlainColorObject}
 */
declare function toGamut(color: ColorTypes, options?: ToGamutOptions): PlainColorObject;
/**
 * @overload
 * @param {ColorTypes} color
 * @param {string} [space]
 * @returns {PlainColorObject}
 */
declare function toGamut(color: ColorTypes, space?: string): PlainColorObject;
declare namespace toGamut {
    let returns: "color";
}
export default toGamut;
/**
 * Given a color `origin`, returns a new color that is in gamut using
 * the CSS Gamut Mapping Algorithm. If `space` is specified, it will be in gamut
 * in `space`, and returned in `space`. Otherwise, it will be in gamut and
 * returned in the color space of `origin`.
 * @param {ColorTypes} origin
 * @param {{ space?: string | ColorSpace | undefined }} options
 * @returns {PlainColorObject}
 */
export function toGamutCSS(origin: ColorTypes, { space }?: {
    space?: string | ColorSpace | undefined;
}): PlainColorObject;
/**
 * Given a color `origin`, returns a new color that is in gamut using
 * the CSS Ray Trace Gamut Mapping Algorithm. If `space` is specified,
 * it will be in gamut `space`, and returned in `space`. Otherwise,
 * it will be in gamut and returned in the color space of `origin`.
 * @param {ColorTypes} origin
 * @param {{ space?: string | ColorSpace | undefined }} options
 * @returns {PlainColorObject}
 */
export function toGamutRayTrace(origin: ColorTypes, { space }?: {
    space?: string | ColorSpace | undefined;
}): PlainColorObject;
export type ToGamutOptions = import("./types.js").ToGamutOptions;
import type { ColorTypes } from "./types.js";
import type { PlainColorObject } from "./types.js";
import ColorSpace from "./ColorSpace.js";
//# sourceMappingURL=toGamut.d.ts.map