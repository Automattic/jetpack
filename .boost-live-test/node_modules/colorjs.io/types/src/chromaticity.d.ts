/** @import Color, { ColorTypes } from "./color.js" */
/**
 * @param {ColorTypes} color
 * @returns {[number, number]}
 */
export function uv(color: ColorTypes): [number, number];
/**
 * @param {ColorTypes} color
 * @returns {[number, number]}
 */
export function xy(color: ColorTypes): [number, number];
/**
 * @param {typeof Color} Color
 */
export function register(Color: typeof import("./color.js").default): void;
import type { ColorTypes } from "./color.js";
//# sourceMappingURL=chromaticity.d.ts.map