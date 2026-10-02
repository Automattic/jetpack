/** @import { ColorTypes, PlainColorObject, ToGamutOptions } from "./types.js" */
/**
 * Convert to color space and return a new color
 * @param {ColorTypes} color
 * @param {string | ColorSpace} space
 * @param {{ inGamut?: boolean | ToGamutOptions | undefined }} options
 * @returns {PlainColorObject}
 */
declare function to(color: ColorTypes, space: string | ColorSpace, { inGamut }?: {
    inGamut?: boolean | ToGamutOptions | undefined;
}): PlainColorObject;
declare namespace to {
    let returns: "color";
}
export default to;
import type { ColorTypes } from "./types.js";
import ColorSpace from "./ColorSpace.js";
import type { ToGamutOptions } from "./types.js";
import type { PlainColorObject } from "./types.js";
//# sourceMappingURL=to.d.ts.map