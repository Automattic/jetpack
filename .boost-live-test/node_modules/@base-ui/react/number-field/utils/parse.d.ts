export declare const PERCENTAGES: string[];
export declare const PERMILLE: string[];
export declare const FULLWIDTH_DECIMAL = "\uFF0E";
export declare const FULLWIDTH_GROUP = "\uFF0C";
export declare const PERCENT_RE: RegExp;
export declare const PERMILLE_RE: RegExp;
export declare const ARABIC_PERSIAN_DETECT_RE: RegExp;
export declare const HAN_DETECT_RE: RegExp;
export declare function isNumeralChar(char: string): boolean;
export declare const BASE_NON_NUMERIC_SYMBOLS: readonly ['.', ',', "．", "，", '٫', '٬'];
export declare const SPACE_SEPARATOR_RE: RegExp;
export declare const FORMAT_CONTROL_DETECT_RE: RegExp;
export declare const PLUS_SIGNS_WITH_ASCII: string[];
export declare const MINUS_SIGNS_WITH_ASCII: string[];
export declare const ANY_MINUS_RE: RegExp;
export declare const ANY_PLUS_RE: RegExp;
export declare const ANY_MINUS_DETECT_RE: RegExp;
export declare const ANY_PLUS_DETECT_RE: RegExp;
/**
 * Returns the `Intl.NumberFormat` parts of a representative number, which surface every
 * non-numeric symbol a given locale/format renders.
 */
export declare function getFormatParts(locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): Intl.NumberFormatPart[];
export declare function getNumberLocaleDetails(locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): {
  decimal: string;
  compact?: string | undefined;
  currency?: string | undefined;
  exponentInteger?: string | undefined;
  exponentMinusSign?: string | undefined;
  exponentSeparator?: string | undefined;
  fraction?: string | undefined;
  group?: string | undefined;
  infinity?: string | undefined;
  integer?: string | undefined;
  literal?: string | undefined;
  minusSign?: string | undefined;
  nan?: string | undefined;
  percent?: string | undefined;
  percentSign?: string | undefined;
  plusSign?: string | undefined;
  unit?: string | undefined;
  unknown?: string | undefined;
};
export declare function parseNumber(formattedNumber: string, locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): number | null;