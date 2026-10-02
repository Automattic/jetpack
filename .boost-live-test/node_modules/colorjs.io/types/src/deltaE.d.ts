/** @import { ColorTypes } from "./types.js" */
/** @typedef {import("./types.js").Methods} Methods */
/**
 *
 * @param {ColorTypes} c1
 * @param {ColorTypes} c2
 * @param {Methods | ({ method?: Methods | undefined } & Record<string, any>)} [o]
 * deltaE method to use as well as any other options to pass to the deltaE function
 * @returns {number}
 * @throws {TypeError} Unknown or unspecified method
 */
export default function deltaE(c1: ColorTypes, c2: ColorTypes, o?: Methods | ({
    method?: Methods | undefined;
} & Record<string, any>)): number;
export type Methods = import("./types.js").Methods;
import type { ColorTypes } from "./types.js";
//# sourceMappingURL=deltaE.d.ts.map