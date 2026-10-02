export function defineCAT({ id, toCone_M, fromCone_M }: CAT, ...args: any[]): void;
/**
 *
 * @param {White} W1
 * @param {White} W2
 * @param {string} id
 * @returns {number[][]}
 */
export function adapt(W1: White, W2: White, id?: string): number[][];
/** @import { White } from "./types.js" */
/** @typedef {import("./types.js").CAT} CAT */
/** @type {Record<string, CAT>} */
export const CATs: Record<string, CAT>;
export type CAT = import("./types.js").CAT;
import type { White } from "./types.js";
//# sourceMappingURL=CATs.d.ts.map