/**
 * @param {Coords} coords
 * @param {number} fl
 * @returns {[number, number, number]}
 */
export function adapt(coords: Coords, fl: number): [number, number, number];
/**
 * @param {Coords} adapted
 * @param {number} fl
 * @returns {[number, number, number]}
 */
export function unadapt(adapted: Coords, fl: number): [number, number, number];
/**
 * @param {number} h
 */
export function hueQuadrature(h: number): number;
/**
 * @param {number} H
 */
export function invHueQuadrature(H: number): number;
/**
 * @param {[number, number, number]} refWhite
 * @param {number} adaptingLuminance
 * @param {number} backgroundLuminance
 * @param {keyof typeof surroundMap} surround
 * @param {boolean} discounting
 * @returns {Cam16Environment}
 */
export function environment(refWhite: [number, number, number], adaptingLuminance: number, backgroundLuminance: number, surround: keyof typeof surroundMap, discounting: boolean): Cam16Environment;
/**
 * @param {Cam16Input} cam16
 * @param {Cam16Environment} env
 * @returns {[number, number, number]}
 */
export function fromCam16(cam16: Cam16Input, env: Cam16Environment): [number, number, number];
/**
 * @param {[number, number, number]} xyzd65
 * @param {Cam16Environment} env
 * @returns {Cam16Object}
 */
export function toCam16(xyzd65: [number, number, number], env: Cam16Environment): Cam16Object;
/**
 * Matrices used by this color space, also available as `CAM16_JMh.M`
 * @type {Record<string, Matrix3x3>}
 */
export const M: Record<string, Matrix3x3>;
declare const _default: ColorSpace;
export default _default;
export type Cam16Object = import("../types.js").Cam16Object;
export type Cam16Input = import("../types.js").Cam16Input;
export type Cam16Environment = import("../types.js").Cam16Environment;
import type { Coords } from "../types.js";
declare namespace surroundMap {
    let dark: number[];
    let dim: number[];
    let average: number[];
}
import type { Matrix3x3 } from "../types.js";
import ColorSpace from "../ColorSpace.js";
//# sourceMappingURL=cam16.d.ts.map