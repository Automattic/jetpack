/**
 * Get a collapsed range for a given point.
 * Gives the container a temporary high z-index (above any UI).
 * This is preferred over getting the UI nodes and set styles there.
 *
 * @param {Document}    doc       The document of the range.
 * @param {number}      x         Horizontal position within the current viewport.
 * @param {number}      y         Vertical position within the current viewport.
 * @param {HTMLElement} container Container in which the range is expected to be found.
 *
 * @return {?Range} The best range for the given point.
 */
export default function hiddenCaretRangeFromPoint(doc: Document, x: number, y: number, container: HTMLElement): Range | null;
//# sourceMappingURL=hidden-caret-range-from-point.d.ts.map