/**
 * More accurate color-difference formulae
 * than the simple 1976 Euclidean distance in CIE Lab
 * The Oklab a and b axes are scaled relative to the L axis, for better uniformity
 * Björn Ottosson said:
 * "I've recently done some tests with color distance datasets as implemented
 * in Colorio and on both the Combvd dataset and the OSA-UCS dataset a
 * scale factor of slightly more than 2 for a and b would give the best results
 * (2.016 works best for Combvd and 2.045 for the OSA-UCS dataset)."
 * @see {@link <https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-945714988>}
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
export default function _default(color: import("../types.js").ColorTypes, sample: import("../types.js").ColorTypes): number;
//# sourceMappingURL=deltaEOK2.d.ts.map