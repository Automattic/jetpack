/**
 * Toe function for L_r
 * @param {number} x
 */
export function toe(x: number): number;
/**
 * Inverse toe function for L_r
 * @param {number} x
 */
export function toeInv(x: number): number;
/**
 * @param {readonly [number, number]} cusp
 * @returns {[number, number]}
 */
export function toSt(cusp: readonly [number, number]): [number, number];
/**
 * @param {Vector3} lab
 * @param {Matrix3x3} lmsToRgb
 */
export function oklabToLinearRGB(lab: Vector3, lmsToRgb: Matrix3x3): Vector3;
/**
 * @param {number} a
 * @param {number} b
 * @param {Matrix3x3} lmsToRgb
 * @param {OKCoeff} okCoeff
 * @returns {[number, number]}
 * @todo Could probably make these types more specific/better-documented if desired
 */
export function findCusp(a: number, b: number, lmsToRgb: Matrix3x3, okCoeff: OKCoeff): [number, number];
/**
 * @param {number} a
 * @param {number} b
 * @param {number} l1
 * @param {number} c1
 * @param {number} l0
 * @param {Matrix3x3} lmsToRgb
 * @param {OKCoeff} okCoeff
 * @param {[number, number]} cusp
 * @returns {Number}
 * @todo Could probably make these types more specific/better-documented if desired
 */
export function findGamutIntersection(a: number, b: number, l1: number, c1: number, l0: number, lmsToRgb: Matrix3x3, okCoeff: OKCoeff, cusp: [number, number]): number;
/** @import { Matrix3x3, Vector3 } from "../types.js" */
/** @typedef {import("../types.js").OKCoeff} OKCoeff */
export const tau: number;
/**
 * Matrices used by this color space (Oklab's, plus its own),
 * also available as `Okhsl.M`
 * @type {Record<string, Matrix3x3>}
 */
export const M: Record<string, Matrix3x3>;
/** @type {OKCoeff} */
export const RGBCoeff: OKCoeff;
export default Okhsl;
export type OKCoeff = import("../types.js").OKCoeff;
import type { Vector3 } from "../types.js";
import type { Matrix3x3 } from "../types.js";
declare const Okhsl: ColorSpace;
import ColorSpace from "../ColorSpace.js";
//# sourceMappingURL=okhsl.d.ts.map