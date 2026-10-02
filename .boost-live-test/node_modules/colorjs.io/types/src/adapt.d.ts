/**
 *
 * @param {string | White} name
 * @returns {White}
 */
export function getWhite(name: string | White): White;
/**
 * Adapt XYZ from white point W1 to W2
 * @param {White | string} W1
 * @param {White | string} W2
 * @param {[number, number, number]} XYZ
 * @param {{ method?: string | undefined }} options
 * @returns {[number, number, number]}
 */
export default function adapt(W1: White | string, W2: White | string, XYZ: [number, number, number], options?: {
    method?: string | undefined;
}): [number, number, number];
/** @typedef {import("./types.js").White} White */
/** @type {Record<string, White>} */
export const WHITES: Record<string, White>;
export type White = import("./types.js").White;
//# sourceMappingURL=adapt.d.ts.map