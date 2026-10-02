/** @typedef {import("./types.js").RGBOptions} RGBOptions */
/** Convenience class for RGB color spaces */
export default class RGBColorSpace extends ColorSpace {
    /**
     * Creates a new RGB ColorSpace.
     * If coords are not specified, they will use the default RGB coords.
     * Instead of `fromBase()` and `toBase()` functions,
     * you can specify to/from XYZ matrices and have the default `toBase()` and `fromBase()`
     * methods use them via `this.M.toXYZ` and `this.M.fromXYZ`.
     * @param {RGBOptions} options
     */
    constructor(options: RGBOptions);
    toBase(rgb: any): import("./types.js").Vector3;
    fromBase(xyz: any): import("./types.js").Vector3;
}
export type RGBOptions = import("./types.js").RGBOptions;
import ColorSpace from "./ColorSpace.js";
//# sourceMappingURL=RGBColorSpace.d.ts.map