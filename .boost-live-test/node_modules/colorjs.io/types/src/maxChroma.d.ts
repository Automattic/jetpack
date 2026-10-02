/**
 * Maximum chroma within an RGB gamut for a given lightness and hue, in a polar space's chroma units.
 * @param {number} l Lightness, in the reduce space's units
 * @param {number} h Hue angle, in degrees
 * @param {{ space: string | ColorSpaceType, gamut: string | ColorSpaceType }} options
 *        `space` is the polar space whose chroma is reduced; `gamut` is the RGB gamut to fit.
 * @returns {number}
 */
export default function maxChroma(l: number, h: number, { space, gamut }: {
    space: string | ColorSpace;
    gamut: string | ColorSpace;
}): number;
/**
 * A digit indexes into the next level; `.value` is the max chroma
 */
export type HueTrie = Array<any> & {
    value?: number;
};
/**
 * A digit indexes into the next level; `.h` is the hue trie at this lightness
 */
export type LightnessTrie = Array<any> & {
    h?: HueTrie;
};
import ColorSpace from "./ColorSpace.js";
//# sourceMappingURL=maxChroma.d.ts.map