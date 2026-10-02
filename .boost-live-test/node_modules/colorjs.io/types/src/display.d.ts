/**
 * Returns a serialization of the color that can actually be displayed in the browser.
 * If the default serialization can be displayed, it is returned.
 * Otherwise, if a `space` is given, the color is converted directly to it.
 * If not, the color is converted to the first supported of its space's `displaySpaces` (if any),
 * else the closest supported space in its base color space chain (which preserves its gamut),
 * else the default fallback space (Lab, REC2020, or P3, whichever is the widest supported).
 * In Node.js, this is basically equivalent to `serialize()` but returns a `String` object instead.
 * @param {ColorTypes} color
 * @param {DisplayOptions} [options] Options. Any properties beyond `space` and `supports` are passed to `serialize()`.
 * @returns {Display} String object containing the serialized color
 * with a color property containing the converted color (or the original, if no conversion was necessary)
 */
export default function display(color: ColorTypes, { space, supports, ...options }?: DisplayOptions): Display;
export type Display = import("./types.js").Display;
import type { ColorTypes } from "./types.js";
import type { DisplayOptions } from "./types.js";
//# sourceMappingURL=display.d.ts.map