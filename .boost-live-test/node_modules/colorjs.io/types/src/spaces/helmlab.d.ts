/** @type {number[]} */
export const HELMLAB_D65: number[];
export namespace M {
    export { CAT_TO_HELM };
    export { CAT_FROM_HELM };
    export { M1 };
    export { M1_INV };
    export { M2 };
    export { M2_INV };
}
export function fromXYZ(xyz: any): number[];
export function toXYZ(lab: any): import("../types.js").Vector3;
declare const _default: ColorSpace;
export default _default;
/** Bradford CAT: Color.js D65 → Helmlab D65 (apply in fromBase before M1) */
/** @type {Matrix3x3} */
declare const CAT_TO_HELM: Matrix3x3;
/** Bradford CAT: Helmlab D65 → Color.js D65 (apply in toBase after M1_INV) */
/** @type {Matrix3x3} */
declare const CAT_FROM_HELM: Matrix3x3;
/** @type {Matrix3x3} */
declare const M1: Matrix3x3;
/** @type {Matrix3x3} */
declare const M1_INV: Matrix3x3;
/** @type {Matrix3x3} */
declare const M2: Matrix3x3;
/** @type {Matrix3x3} */
declare const M2_INV: Matrix3x3;
import ColorSpace from "../ColorSpace.js";
import type { Matrix3x3 } from "../types.js";
//# sourceMappingURL=helmlab.d.ts.map