/** @import { ColorTypes } from "./types.js" */
/** @typedef {import("./types.js").Algorithms} Algorithms */
/**
 *
 * @param {ColorTypes} background
 * @param {ColorTypes} foreground
 * @param {Algorithms | ({ algorithm: Algorithms } & Record<string, any>)} o
 * Algorithm to use as well as any other options to pass to the contrast function
 * @returns {number}
 * @throws {TypeError} Unknown or unspecified algorithm
 */
export default function contrast(background: ColorTypes, foreground: ColorTypes, o: Algorithms | ({
    algorithm: Algorithms;
} & Record<string, any>)): number;
export type Algorithms = import("./types.js").Algorithms;
import type { ColorTypes } from "./types.js";
//# sourceMappingURL=contrast.d.ts.map