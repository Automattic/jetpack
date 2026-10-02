/**
 * Get the rectangle of a given Range. Returns `null` if no suitable rectangle
 * can be found. Use instead of `Range.getBoundingClientRect()`, which is often
 * broken, especially for collapsed ranges.
 *
 * @param {Range} range The range.
 *
 * @return {DOMRect?} The rectangle.
 */
export default function getRectangleFromRange(range: Range): DOMRect | null;
//# sourceMappingURL=get-rectangle-from-range.d.ts.map