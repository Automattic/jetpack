/**
 * Get the coordinates of a color in any color space
 * @overload
 * @param {ColorTypes} color
 * @param {string | ColorSpace} [options=color.space] The color space to convert to. Defaults to the color's current space
 * @returns {Coords} The color coordinates in the given color space
 */
export default function getAll(color: ColorTypes, options?: string | ColorSpace): Coords;
/**
 * @overload
 * @param {ColorTypes} color
 * @param {GetAllOptions} [options]
 * @returns {Coords} The color coordinates in the given color space
 */
export default function getAll(color: ColorTypes, options?: GetAllOptions): Coords;
/**
 * Options for {@link getAll}
 */
export type GetAllOptions = {
    /**
     * The color space to convert to. Defaults to the color's current space
     */
    space?: string | ColorSpace | undefined;
    /**
     * The number of significant digits to round the coordinates to
     */
    precision?: number | undefined;
};
import type { ColorTypes } from "./types.js";
import ColorSpace from "./ColorSpace.js";
import type { Coords } from "./types.js";
//# sourceMappingURL=getAll.d.ts.map