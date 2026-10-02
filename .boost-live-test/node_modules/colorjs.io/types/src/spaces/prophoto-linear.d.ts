/** @import { Matrix3x3 } from "../types.js" */
/**
 * Matrices used by this color space, also available as `ProPhoto_Linear.M`.
 * Uses D50 (so no chromatic adaptation needed afterwards). The matrix cannot
 * be expressed in rational form, but is calculated to 64 bit accuracy.
 * see https://github.com/w3c/csswg-drafts/issues/7675
 * @type {Record<string, Matrix3x3>}
 */
export const M: Record<string, Matrix3x3>;
declare const _default: RGBColorSpace;
export default _default;
import type { Matrix3x3 } from "../types.js";
import RGBColorSpace from "../RGBColorSpace.js";
//# sourceMappingURL=prophoto-linear.d.ts.map