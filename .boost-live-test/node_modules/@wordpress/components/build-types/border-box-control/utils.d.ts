import type { Border } from '../border-control/types';
import type { AnyBorder, Borders } from './types';
export declare const isEmptyBorder: (border?: Border) => boolean;
export declare const isDefinedBorder: (border: AnyBorder) => boolean;
export declare const isCompleteBorder: (border?: Border) => boolean;
export declare const hasSplitBorders: (border?: AnyBorder) => boolean;
export declare const hasMixedBorders: (borders: AnyBorder) => boolean;
export declare const getSplitBorders: (border?: Border) => {
    top: Border;
    right: Border;
    bottom: Border;
    left: Border;
} | undefined;
export declare const getBorderDiff: (original: Border, updated: Border) => Border;
export declare const getCommonBorder: (borders?: Borders) => {
    color: import("csstype").Property.BorderColor | undefined;
    style: import("csstype").Property.BorderStyle | undefined;
    width: string | number | undefined;
} | undefined;
export declare const getShorthandBorderStyle: (border?: Border, fallbackBorder?: Border) => string | Border | undefined;
export declare const getMostCommonUnit: (values: Array<string | number | undefined>) => string | undefined;
//# sourceMappingURL=utils.d.ts.map