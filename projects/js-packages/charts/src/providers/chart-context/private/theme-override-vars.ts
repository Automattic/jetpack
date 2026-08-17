import type { ChartTheme } from '../../../types';

// The consumer theme fields that correspond to an emitted catalog role, and the role each one overrides. Each role must be read by exactly the elements its field controlled before the role existed: `svgLabelSmall.fill` maps to the narrow `--a8c-charts-color-label-axis` rather than `--a8c-charts-color-label`, because the broad role is also read by legend labels, heatmap cell values, funnel labels and the line-chart tooltip, which that field never moved.
const ROLE_FOR_FIELD: Array< [ string, ( theme: Partial< ChartTheme > ) => string | undefined ] > =
	[
		[ '--a8c-charts-color-background', theme => theme.backgroundColor ],
		[ '--a8c-charts-color-grid', theme => theme.gridStyles?.stroke ],
		[ '--a8c-charts-color-axis', theme => theme.xAxisLineStyles?.stroke ],
		[ '--a8c-charts-color-tick', theme => theme.xTickLineStyles?.stroke ],
		[ '--a8c-charts-color-label-axis', theme => theme.svgLabelSmall?.fill ],
	];

/**
 * Whether a value already reads the role it would define.
 *
 * Two things this has to get right, both of which a plain substring test gets wrong:
 *
 * `var()` permits whitespace after the opening paren, so testing for `var(<role>` misses `var( --a8c-charts-color-grid, … )`. Emitting that as the value of the same custom property makes it reference itself, which CSS treats as invalid at computed-value time — the declaration drops and the token resolves to nothing, so every chart loses that colour rather than falling back to the catalog default.
 *
 * Conversely, several roles are prefixes of others (`--a8c-charts-color-label` of `--a8c-charts-color-label-secondary`). A prefix match would treat a legitimate cross-role pointer as a self-reference and silently drop the override, so the role must be followed by something that cannot continue an identifier — `-` included.
 *
 * `resolveCssVariable` also accepts a bare custom-property name with no `var()` wrapper (`--a8c-charts-color-grid`), so that is legal `theme` input too. Unlike the `var()` form, `--a8c-charts-color-grid: --a8c-charts-color-grid;` is not invalid at computed-value time — custom properties accept arbitrary token streams — so it survives and every reader gets the literal string instead of a color, dropping silently at the use site rather than falling back to the catalog default.
 *
 * @param value - The consumer's value for the field.
 * @param role  - The custom property this value would be emitted as.
 * @return True when the value reads `role`, so it must not be emitted as `role`.
 */
const readsOwnRole = ( value: string, role: string ): boolean =>
	value.trim() === role ||
	new RegExp( `var\\(\\s*${ role.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }(?![\\w-])` ).test(
		value
	);

/**
 * Maps a sparse consumer theme onto the instance-scoped `--a8c-charts-*` variables it overrides, so CSS-painted and JS-resolved colours read one source.
 *
 * A value that already points at the role it would define is skipped — that is the default theme's own pointer surviving `mergeThemes`.
 *
 * @param theme - The consumer's `theme` prop, possibly merged with the default theme.
 * @return CSS custom properties to write on the provider wrapper.
 */
export const themeOverrideVars = ( theme?: Partial< ChartTheme > ): Record< string, string > => {
	if ( ! theme ) {
		return {};
	}

	const vars: Record< string, string > = {};

	for ( const [ role, read ] of ROLE_FOR_FIELD ) {
		const value = read( theme );

		if ( typeof value === 'string' && value !== '' && ! readsOwnRole( value, role ) ) {
			vars[ role ] = value;
		}
	}

	return vars;
};
