/**
 * Check if a color is in gamut of either its own or another color space
 * @param {ColorTypes} color
 * @param {string | ColorSpace} [space]
 * @param {{ epsilon?: number | undefined }} [param2]
 * @returns {boolean}
 */
export default function inGamut(color: ColorTypes, space?: string | ColorSpace, { epsilon }?: {
    epsilon?: number | undefined;
}): boolean;
import type { ColorTypes } from "./types.js";
import ColorSpace from "./ColorSpace.js";
//# sourceMappingURL=inGamut.d.ts.map