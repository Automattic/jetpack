import deepmerge from 'deepmerge';
import type { ChartTheme, CompleteChartTheme } from '../types';

/**
 * Merges chart themes with proper precedence.
 * The second theme (override) takes precedence over the first theme (base).
 *
 * @param baseTheme     - Base theme object
 * @param overrideTheme - Theme to override base with (takes precedence)
 * @return Merged theme with overrideTheme values taking precedence
 */
export function mergeThemes(
	baseTheme: CompleteChartTheme,
	overrideTheme: Partial< ChartTheme >
): CompleteChartTheme;
export function mergeThemes(
	baseTheme: ChartTheme,
	overrideTheme: Partial< ChartTheme >
): ChartTheme;
export function mergeThemes(
	baseTheme: ChartTheme,
	overrideTheme: Partial< ChartTheme >
): ChartTheme {
	// Use deepmerge to properly merge nested objects, with overrideTheme taking precedence
	return deepmerge( baseTheme, overrideTheme, {
		// Ensure arrays are replaced rather than concatenated
		arrayMerge: ( _destinationArray, sourceArray ) => sourceArray,
	} ) as ChartTheme;
}
