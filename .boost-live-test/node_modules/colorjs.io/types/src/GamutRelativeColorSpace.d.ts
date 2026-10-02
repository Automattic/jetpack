/** @import { SpaceOptions } from "./ColorSpace.js" */
/**
 * A color space whose chroma-like coordinate is expressed relative to an RGB gamut: chroma = 1 is
 * the most colorful in-gamut color for the rest of the coordinates, so any chroma in [0, 1] stays
 * in gamut. The reduced coordinate (`chroma`, default `"c"`) is rescaled against `gamutSpace`; every
 * other coordinate is inherited unchanged from `base`. Works for any base whose chroma coordinate
 * brings the color into gamut as it is reduced (e.g. OKLCh, LCH).
 */
export default class GamutRelativeColorSpace extends ColorSpace {
    /**
     * @param {SpaceOptions & { gamutSpace: string | ColorSpace, chroma?: string }} options
     *        Requires `base` (the source space) and `gamutSpace` (the RGB gamut). `chroma` names the
     *        coordinate to rescale (default `"c"`).
     */
    constructor(options: SpaceOptions & {
        gamutSpace: string | ColorSpace;
        chroma?: string;
    });
    chromaIndex: number;
    method: string;
    oogChroma: number;
    /**
     * The highest in-gamut value of the reduced coordinate for the given coordinates. The reduced
     * coordinate's own value is ignored; the others determine the result.
     * @param {number[]} coords
     * @returns {number}
     */
    maxChroma(coords: number[]): number;
    toBase(coords: any): any;
    fromBase(coords: any): any;
}
import ColorSpace from "./ColorSpace.js";
import type { SpaceOptions } from "./ColorSpace.js";
//# sourceMappingURL=GamutRelativeColorSpace.d.ts.map