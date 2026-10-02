/** @import { ColorConstructor } from "./types.js" */
/** @typedef {import("./types.js").ArgumentMeta} ArgumentMeta */
/** @typedef {import("./types.js").ParseFunctionReturn} ParseFunctionReturn */
/** @typedef {import("./types.js").ParseOptions} ParseOptions */
/**
 * Convert a CSS Color string to a color object
 * @param {string} str
 * @param {ParseOptions} [options]
 * @returns {ColorConstructor}
 */
export default function parse(str: string, options?: ParseOptions): ColorConstructor;
/**
 * Parse a single function argument
 * @param {string} rawArg
 * @returns {{value: number, meta: ArgumentMeta}}
 */
export function parseArgument(rawArg: string): {
    value: number;
    meta: ArgumentMeta;
};
/**
 * Parse a CSS function, regardless of its name and arguments
 * @param {string} str String to parse
 * @return {ParseFunctionReturn | void}
 */
export function parseFunction(str: string): ParseFunctionReturn | void;
/**
 * Units and multiplication factors for the internally stored numbers
 */
export const units: {
    "%": number;
    deg: number;
    grad: number;
    rad: number;
    turn: number;
};
export namespace regex {
    let _function: RegExp;
    export { _function as function };
    export let number: RegExp;
    export let unitValue: RegExp;
    export let singleArgument: RegExp;
}
export type ArgumentMeta = import("./types.js").ArgumentMeta;
export type ParseFunctionReturn = import("./types.js").ParseFunctionReturn;
export type ParseOptions = import("./types.js").ParseOptions;
import type { ColorConstructor } from "./types.js";
//# sourceMappingURL=parse.d.ts.map