import { defaultTheme } from '../themes';
import type { CompleteChartTheme } from '../../../types';

// Restores each overridden role's mapped theme field to the catalog pointer `defaultTheme` already carries for it, so the value comes from `themes.ts` itself rather than a second, hand-copied literal.
const CATALOG_RESTORE_FOR_ROLE: Record<
	string,
	( theme: CompleteChartTheme ) => Partial< CompleteChartTheme >
> = {
	'--a8c-charts-color-background': () => ( { backgroundColor: defaultTheme.backgroundColor } ),
	'--a8c-charts-color-grid': theme => ( {
		gridStyles: { ...theme.gridStyles, stroke: defaultTheme.gridStyles.stroke },
	} ),
	'--a8c-charts-color-axis': theme => ( {
		xAxisLineStyles: { ...theme.xAxisLineStyles, stroke: defaultTheme.xAxisLineStyles.stroke },
	} ),
	'--a8c-charts-color-tick': theme => ( {
		xTickLineStyles: { ...theme.xTickLineStyles, stroke: defaultTheme.xTickLineStyles.stroke },
	} ),
	'--a8c-charts-color-label-axis': theme => ( {
		svgLabelSmall: { ...theme.svgLabelSmall, fill: defaultTheme.svgLabelSmall.fill },
	} ),
};

/**
 * Restores the mapped theme fields of `overriddenRoles` to their catalog pointer, so the theme-layer variable `themeOverrideVars` writes on the provider wrapper is the only carrier for an overridden role — CSS and the JS bridge (`useXYChartTheme`) then resolve it through the same cascade instead of visx reading a baked literal that can disagree with a closer CSS override.
 *
 * This covers roles `themeOverrideVars` deliberately left unpublished as well as the ones it published. A value that reads its own role is not publishable, but leaving visx the consumer's literal is what the whole mechanism exists to prevent: `theme={ { gridStyles: { stroke: 'var(--brand, var(--a8c-charts-color-grid, red))' } } }` would have CSS paint the catalog default while visx painted `--brand`.
 *
 * Every field outside the five mapped roles is left exactly as `merged` provided it: those aren't published as theme-layer vars, so rewriting them would erase a consumer's override with no replacement carrier.
 *
 * @param merged          - The consumer theme merged onto `defaultTheme` (`mergeThemes` output).
 * @param overriddenRoles - The catalog roles the consumer overrode, from `themeOverrideVars`.
 * @return A new theme object; `merged` is not mutated.
 */
export const withCatalogPointers = (
	merged: CompleteChartTheme,
	overriddenRoles: readonly string[]
): CompleteChartTheme => {
	let result = merged;

	for ( const role of overriddenRoles ) {
		const restore = CATALOG_RESTORE_FOR_ROLE[ role ];

		if ( restore ) {
			result = { ...result, ...restore( result ) };
		}
	}

	return result;
};
