import type { HandleClose, HandleCloseOptions } from "./hooks/useHoverShared.js";
export interface SafePolygonOptions extends HandleCloseOptions {}
/**
 * Generates a safe polygon area that the user can traverse without closing the
 * floating element once leaving the reference element.
 * @see https://floating-ui.com/docs/useHover#safepolygon
 */
export declare function safePolygon(options?: SafePolygonOptions): HandleClose;