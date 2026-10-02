import type { FormatDistanceFn } from "../../types.ts";
export type FormatDistanceTokanRelativeValue = {
  one: string;
  other: string;
};
export type FormatDistanceLocaleValue =
  | FormatDistanceTokanRelativeValue
  | string;
export declare const formatDistance: FormatDistanceFn;
