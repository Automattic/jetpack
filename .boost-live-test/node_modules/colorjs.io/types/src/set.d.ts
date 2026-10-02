/**
 * Set properties and return current instance
 * @overload
 * @param {ColorTypes} color
 * @param {Ref} prop
 * @param {number | ((coord: number) => number)} value
 * @returns {PlainColorObject}
 */
declare function set(color: ColorTypes, prop: Ref, value: number | ((coord: number) => number)): PlainColorObject;
/**
 * @overload
 * @param {ColorTypes} color
 * @param {Record<string, number | ((coord: number) => number)>} props
 * @returns {PlainColorObject}
 */
declare function set(color: ColorTypes, props: Record<string, number | ((coord: number) => number)>): PlainColorObject;
declare namespace set {
    let returns: "color";
}
export default set;
import type { ColorTypes } from "./types.js";
import type { Ref } from "./types.js";
import type { PlainColorObject } from "./types.js";
//# sourceMappingURL=set.d.ts.map