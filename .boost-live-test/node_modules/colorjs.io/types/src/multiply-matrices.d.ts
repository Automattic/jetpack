/**
 * A is m x n. B is n x p. product is m x p.
 *
 * Array arguments are treated like vectors:
 * - A becomes 1 x n
 * - B becomes n x 1
 *
 * Returns Matrix m x p or equivalent array or number
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[]} B Vector n x 1
 * @returns {number} Scalar number
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[]} B Vector n x 1
 * @returns {number[]} Array with length m
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[]} Array with length p
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[][]} Matrix m x p
 *
 * @param {number[] | number[][]} A Matrix m x n or a vector
 * @param {number[] | number[][]} B Matrix n x p or a vector
 * @returns {number | number[] | number[][]} Matrix m x p or equivalent array or number
 */
export default function multiplyMatrices(A: number[], B: number[]): number;
/**
 * A is m x n. B is n x p. product is m x p.
 *
 * Array arguments are treated like vectors:
 * - A becomes 1 x n
 * - B becomes n x 1
 *
 * Returns Matrix m x p or equivalent array or number
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[]} B Vector n x 1
 * @returns {number} Scalar number
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[]} B Vector n x 1
 * @returns {number[]} Array with length m
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[]} Array with length p
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[][]} Matrix m x p
 *
 * @param {number[] | number[][]} A Matrix m x n or a vector
 * @param {number[] | number[][]} B Matrix n x p or a vector
 * @returns {number | number[] | number[][]} Matrix m x p or equivalent array or number
 */
export default function multiplyMatrices(A: number[][], B: number[]): number[];
/**
 * A is m x n. B is n x p. product is m x p.
 *
 * Array arguments are treated like vectors:
 * - A becomes 1 x n
 * - B becomes n x 1
 *
 * Returns Matrix m x p or equivalent array or number
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[]} B Vector n x 1
 * @returns {number} Scalar number
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[]} B Vector n x 1
 * @returns {number[]} Array with length m
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[]} Array with length p
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[][]} Matrix m x p
 *
 * @param {number[] | number[][]} A Matrix m x n or a vector
 * @param {number[] | number[][]} B Matrix n x p or a vector
 * @returns {number | number[] | number[][]} Matrix m x p or equivalent array or number
 */
export default function multiplyMatrices(A: number[], B: number[][]): number[];
/**
 * A is m x n. B is n x p. product is m x p.
 *
 * Array arguments are treated like vectors:
 * - A becomes 1 x n
 * - B becomes n x 1
 *
 * Returns Matrix m x p or equivalent array or number
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[]} B Vector n x 1
 * @returns {number} Scalar number
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[]} B Vector n x 1
 * @returns {number[]} Array with length m
 *
 * @overload
 * @param {number[]} A Vector 1 x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[]} Array with length p
 *
 * @overload
 * @param {number[][]} A Matrix m x n
 * @param {number[][]} B Matrix n x p
 * @returns {number[][]} Matrix m x p
 *
 * @param {number[] | number[][]} A Matrix m x n or a vector
 * @param {number[] | number[][]} B Matrix n x p or a vector
 * @returns {number | number[] | number[][]} Matrix m x p or equivalent array or number
 */
export default function multiplyMatrices(A: number[][], B: number[][]): number[][];
/**
 * Transforms a vector of length 3 by a 3x3 matrix. Specify the same input and output
 * vector to transform in place.
 *
 * @param {Vector3} input
 * @param {Matrix3x3} matrix
 * @param {Vector3} [out]
 * @returns {Vector3}
 */
export function multiply_v3_m3x3(input: Vector3, matrix: Matrix3x3, out?: Vector3): Vector3;
import type { Vector3 } from "./types.js";
import type { Matrix3x3 } from "./types.js";
//# sourceMappingURL=multiply-matrices.d.ts.map