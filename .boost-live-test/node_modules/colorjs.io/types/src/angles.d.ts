/**
 * Constrain an angle to 360 degrees
 * @param {number} angle
 * @returns {number}
 */
export function constrain(angle: number): number;
/**
 * @param {"raw" | "increasing" | "decreasing" | "longer" | "shorter"} arc
 * @param {[number, number]} angles
 * @returns {[number, number]}
 */
export function adjust(arc: "raw" | "increasing" | "decreasing" | "longer" | "shorter", angles: [number, number]): [number, number];
//# sourceMappingURL=angles.d.ts.map