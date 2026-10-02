/**
 * Resolves a color reference (object or string) to a plain color object, or `null` if resolution fails.
 * Can resolve more complex CSS colors (e.g. relative colors, `calc()`, CSS variables, `color-mix()`, etc.) through the DOM.
 *
 * @overload
 * @param {ColorTypes} color
 * @param {TryColorOptions} [options]
 * @returns {PlainColorObject | null}
 */
export default function tryColor(color: ColorTypes, options?: TryColorOptions): PlainColorObject | null;
/**
 * @overload
 * @param {ColorTypes[]} color
 * @param {TryColorOptions} [options]
 * @returns {(PlainColorObject | null)[]}
 */
export default function tryColor(color: ColorTypes[], options?: TryColorOptions): (PlainColorObject | null)[];
export type TryColorOptions = import("./types.js").TryColorOptions;
import type { ColorTypes } from "./types.js";
import type { PlainColorObject } from "./types.js";
//# sourceMappingURL=tryColor.d.ts.map