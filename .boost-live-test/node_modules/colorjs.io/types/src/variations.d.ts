/** @import { ColorTypes, PlainColorObject, Ref } from "./types.js" */
/**
 * @param {ColorTypes} color
 * @param {number} amount
 * @returns {PlainColorObject}
 */
export function lighten(color: ColorTypes, amount?: number): PlainColorObject;
export namespace lighten {
    let returns: "color";
}
/**
 * @param {ColorTypes} color
 * @param {number} amount
 * @returns {PlainColorObject}
 */
export function darken(color: ColorTypes, amount?: number): PlainColorObject;
export namespace darken {
    let returns_1: "color";
    export { returns_1 as returns };
}
import type { ColorTypes } from "./types.js";
import type { PlainColorObject } from "./types.js";
//# sourceMappingURL=variations.d.ts.map