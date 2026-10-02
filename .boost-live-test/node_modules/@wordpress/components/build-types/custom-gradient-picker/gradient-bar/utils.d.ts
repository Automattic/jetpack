import type { ControlPoint } from '../types';
/**
 * Clamps a number between 0 and 100.
 *
 * @param value Value to clamp.
 *
 * @return Value clamped between 0 and 100.
 */
export declare function clampPercent(value: number): number;
/**
 * Check if a control point is overlapping with another.
 *
 * @param value        Array of control points.
 * @param initialIndex Index of the position to test.
 * @param newPosition  New position of the control point.
 * @param minDistance  Distance considered to be overlapping.
 *
 * @return True if the point is overlapping.
 */
export declare function isOverlapping(value: ControlPoint[], initialIndex: number, newPosition: number, minDistance?: number): boolean;
/**
 * Adds a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param position Position to insert the new point.
 * @param color    Color to update the control point at index.
 *
 * @return New array of control points.
 */
export declare function addControlPoint(points: ControlPoint[], position: number, color: ControlPoint['color']): ControlPoint[];
/**
 * Removes a control point from an array and returns the new array.
 *
 * @param points Array of control points.
 * @param index  Index to remove.
 *
 * @return New array of control points.
 */
export declare function removeControlPoint(points: ControlPoint[], index: number): ControlPoint[];
/**
 * Updates a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param index    Index to update.
 * @param newPoint New control point to replace the index.
 *
 * @return New array of control points.
 */
export declare function updateControlPoint(points: ControlPoint[], index: number, newPoint: ControlPoint): ControlPoint[];
/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param points      Array of control points.
 * @param index       Index to update.
 * @param newPosition Position to move the control point at index.
 *
 * @return New array of control points.
 */
export declare function updateControlPointPosition(points: ControlPoint[], index: number, newPosition: ControlPoint['position']): ControlPoint[];
/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param index    Index to update.
 * @param newColor Color to update the control point at index.
 *
 * @return New array of control points.
 */
export declare function updateControlPointColor(points: ControlPoint[], index: number, newColor: ControlPoint['color']): ControlPoint[];
/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param position Position of the color stop.
 * @param newColor Color to update the control point at index.
 *
 * @return New array of control points.
 */
export declare function updateControlPointColorByPosition(points: ControlPoint[], position: ControlPoint['position'], newColor: ControlPoint['color']): ControlPoint[];
/**
 * Gets the horizontal coordinate when dragging a control point with the mouse.
 *
 * @param mouseXcoordinate Horizontal coordinate of the mouse position.
 * @param containerElement Container for the gradient picker.
 *
 * @return Whole number percentage from the left.
 */
export declare function getHorizontalRelativeGradientPosition(mouseXcoordinate: number, containerElement: HTMLDivElement): number;
export declare function getHorizontalRelativeGradientPosition(mouseXcoordinate: number, containerElement: null): undefined;
//# sourceMappingURL=utils.d.ts.map