import { defaultTheme } from '../themes';
import type { CompleteChartTheme } from '../../../types';

// Restores each overridden role's mapped theme field to the catalog pointer
// `defaultTheme` already carries for it, so the value comes from `themes.ts`
// itself rather than a second, hand-copied literal.
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
	'--a8c-charts-color-label': theme => ( {
		svgLabelSmall: { ...theme.svgLabelSmall, fill: defaultTheme.svgLabelSmall.fill },
	} ),
};

/**
 * Restores the mapped theme fields of `overriddenRoles` to their catalog pointer, so
 * the instance-scoped `--a8c-charts-*` var `themeOverrideVars` writes on the provider
 * wrapper is the only carrier for an overridden role — CSS and the JS bridge
 * (`useXYChartTheme`) then resolve it through the same cascade instead of visx reading
 * a baked literal that can disagree with a closer CSS override.
 *
 * Every field outside the five mapped roles is left exactly as `merged` provided it:
 * those aren't written as instance vars by `themeOverrideVars`, so rewriting them would
 * erase a consumer's override with no replacement carrier.
 *
 * @param merged          - The consumer theme merged onto `defaultTheme` (`mergeThemes` output).
 * @param overriddenRoles - The catalog roles `themeOverrideVars` found overridden, keyed by role.
 * @return A new theme object; `merged` is not mutated.
 */
export const withCatalogPointers = (
	merged: CompleteChartTheme,
	overriddenRoles: Record< string, string >
): CompleteChartTheme => {
	let result = merged;

	for ( const role of Object.keys( overriddenRoles ) ) {
		const restore = CATALOG_RESTORE_FOR_ROLE[ role ];

		if ( restore ) {
			result = { ...result, ...restore( result ) };
		}
	}

	return result;
};
