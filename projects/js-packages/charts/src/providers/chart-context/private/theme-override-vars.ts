import type { ChartTheme } from '../../../types';

// The consumer theme fields that correspond to an emitted catalog role, and the
// role each one overrides.
const ROLE_FOR_FIELD: Array< [ string, ( theme: Partial< ChartTheme > ) => string | undefined ] > =
	[
		[ '--a8c-charts-color-background', theme => theme.backgroundColor ],
		[ '--a8c-charts-color-grid', theme => theme.gridStyles?.stroke ],
		[ '--a8c-charts-color-axis', theme => theme.xAxisLineStyles?.stroke ],
		[ '--a8c-charts-color-tick', theme => theme.xTickLineStyles?.stroke ],
		[ '--a8c-charts-color-label', theme => theme.svgLabelSmall?.fill ],
	];

/**
 * Maps a sparse consumer theme onto the instance-scoped `--a8c-charts-*` variables it
 * overrides, so CSS-painted and JS-resolved colours read one source.
 *
 * A value that already points at the role it would define is skipped: that is the
 * default theme's own pointer surviving `mergeThemes`, and emitting it would make the
 * custom property reference itself, which CSS discards.
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

		if ( typeof value === 'string' && value !== '' && ! value.includes( `var(${ role }` ) ) {
			vars[ role ] = value;
		}
	}

	return vars;
};
