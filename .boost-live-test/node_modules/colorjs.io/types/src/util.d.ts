/**
 * Check if a value is a string (including a String object)
 * @param {any} str - Value to check
 * @returns {str is string}
 */
export function isString(str: any): str is string;
/**
 * Determine the internal JavaScript [[Class]] of an object.
 * @param {any} o - Value to check
 * @returns {string}
 */
export function type(o: any): string;
/**
 * @param {number} n
 * @param {{ precision?: number | undefined, unit?: string | undefined }} options
 * @returns {string}
 */
export function serializeNumber(n: number, { precision, unit }: {
    precision?: number | undefined;
    unit?: string | undefined;
}): string;
/**
 * Check if a value corresponds to a none argument
 * @param {any} n - Value to check
 * @returns {n is null}
 */
export function isNone(n: any): n is null;
/**
 * Replace none values with 0
 * @param {number | null} n
 * @returns {number}
 */
export function skipNone(n: number | null): number;
/**
 * Round a number to a certain number of significant digits
 * @param {number} n - The number to round
 * @param {number} precision - Number of significant digits
 */
export function toPrecision(n: number, precision: number): number;
/**
 * Interpolate between two values, either of which may be a `none` value.
 * A `none` endpoint is treated as having the other endpoint's value;
 * if both are `none`, the result is `none` as well.
 * @param {number | null} start
 * @param {number | null} end
 * @param {number} p
 * @returns {number | null}
 */
export function interpolate(start: number | null, end: number | null, p: number): number | null;
/**
 * @param {number} start
 * @param {number} end
 * @param {number} value
 */
export function interpolateInv(start: number, end: number, value: number): number;
/**
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} value
 */
export function mapRange(from: [number, number], to: [number, number], value: number): number;
/**
 * Clamp value between the minimum and maximum
 * @param {number} min minimum value to return
 * @param {number} val the value to return if it is between min and max
 * @param {number} max maximum value to return
 */
export function clamp(min: number, val: number, max: number): number;
/**
 * Copy sign of one value to another.
 * @param {number} to - Number to copy sign to
 * @param {number} from - Number to copy sign from
 */
export function copySign(to: number, from: number): number;
/**
 * Perform pow on a signed number and copy sign to result
 * @param {number} base The base number
 * @param {number} exp The exponent
 */
export function spow(base: number, exp: number): number;
/**
 * Perform a divide, but return zero if the denominator is zero
 * @param {number} n The numerator
 * @param {number} d The denominator
 */
export function zdiv(n: number, d: number): number;
/**
 * Perform a bisect on a sorted list and locate the insertion point for
 * a value in arr to maintain sorted order.
 * @param {number[]} arr - array of sorted numbers
 * @param {number} value - value to find insertion point for
 * @param {number} lo - used to specify a the low end of a subset of the list
 * @param {number} hi - used to specify a the high end of a subset of the list
 */
export function bisectLeft(arr: number[], value: number, lo?: number, hi?: number): number;
/**
 * Determines whether an argument is an instance of a constructor, including subclasses.
 * This is done by first just checking `instanceof`,
 * and then comparing the string names of the constructors if that fails.
 * @param {any} arg
 * @param {C} constructor
 * @template {new (...args: any) => any} C
 * @returns {arg is InstanceType<C>}
 */
export function isInstance<C extends new (...args: any) => any>(arg: any, constructor: C): arg is InstanceType<C>;
/**
 * Generate a matrix of size NxN with the given diagonal values of length N.
 *
 * @param {number[]} values
 * @returns {number[][]}
 */
export function diag(values: number[]): number[][];
/**
 * Calculate the LU decomposition of an NxN matrix.
 *
 * P is returned as PA = UL or A = P'UL which follows Matlab and Octave opposed to Scipy which returns P as
 * A = PUL or P'A = UL. For matrix inverse, we need P such that PA = UL and it is faster not having to invert
 * P, even if we can invert it fairly fast as it is just a shuffled identity matrix.
 *
 * P is returned as a permutation matrix unless pIndices is true, in which case P would be returned as
 * a vector containing the indexes such that A[P,:] = L*U.
 *
 * Reference:
 * - https://www.statlect.com/matrix-algebra/Gaussian-elimination
 * - https://www.sciencedirect.com/topics/mathematics/partial-pivoting
 *
 * @overload
 * @param {number[][]} matrix
 * @param {{ pIndices?: false | undefined }} [options]
 * @returns {[number[][], number[][], number[][]]}
 */
export function lu(matrix: number[][], options?: {
    pIndices?: false | undefined;
}): [number[][], number[][], number[][]];
/**
 * @overload
 * @param {number[][]} matrix
 * @param {{ pIndices?: true }} [options]
 * @returns {[number[], number[][], number[][]]}
 */
export function lu(matrix: number[][], options?: {
    pIndices?: true;
}): [number[], number[][], number[][]];
/**
 * Invert a NxN matrix.
 *
 * @param {number[][]} matrix
 * @returns {number[][]}
 */
export function inv(matrix: number[][]): number[][];
/**
 * Solve a NxN matrix representing a system of equations.
 *
 * @param {number[][]} matrix
 * @param {number[]} vector
 * @returns {number[]}
 */
export function solve(matrix: number[][], vector: number[]): number[];
export { default as multiplyMatrices, multiply_v3_m3x3 } from "./multiply-matrices.js";
//# sourceMappingURL=util.d.ts.map