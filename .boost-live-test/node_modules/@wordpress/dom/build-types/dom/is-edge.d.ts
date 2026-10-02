/**
 * Check whether the selection is at the edge of the container. Checks for
 * horizontal position by default. Set `onlyVertical` to true to check only
 * vertically.
 *
 * @param {HTMLElement} container            Focusable element.
 * @param {boolean}     isReverse            Set to true to check left, false to check right.
 * @param {boolean}     [onlyVertical=false] Set to true to check only vertical position.
 *
 * @return {boolean} True if at the edge, false if not.
 */
export default function isEdge(container: HTMLElement, isReverse: boolean, onlyVertical?: boolean): boolean;
//# sourceMappingURL=is-edge.d.ts.map