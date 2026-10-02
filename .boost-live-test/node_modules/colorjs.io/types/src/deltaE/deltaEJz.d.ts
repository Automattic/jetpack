/**
 * More accurate color-difference formulae
 * than the simple 1976 Euclidean distance in Lab
 *
 * Uses JzCzHz, which has improved perceptual uniformity
 * and thus a simple Euclidean root-sum of ΔL² ΔC² ΔH²
 * gives good results.
 * @param {import("../types.js").ColorTypes} color
 * @param {import("../types.js").ColorTypes} sample
 * @returns {number}
 */
export default function _default(color: import("../types.js").ColorTypes, sample: import("../types.js").ColorTypes): number;
//# sourceMappingURL=deltaEJz.d.ts.map