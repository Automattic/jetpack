import { isValidHexColor } from '../../../utils/color-utils';
import { shadeWithContrast, tintWithContrast } from './overlap-bars';
import type { SeriesData } from '../../../types';

/**
 * Pairs each comparison series with the primary of its `group`, or with the only primary.
 *
 * @param series - The chart's series.
 * @return The index of each paired comparison's primary, keyed by the comparison's index.
 */
function getComparisonPrimaries( series: SeriesData[] ): Map< number, number > {
	const primaries = series.flatMap( ( item, index ) =>
		item.options?.type === 'comparison' ? [] : [ { group: item.group, index } ]
	);
	const primaryByGroup = new Map( primaries.map( ( { group, index } ) => [ group, index ] ) );
	const onlyPrimary = primaries.length === 1 ? primaries[ 0 ].index : undefined;
	const pairs = new Map< number, number >();

	series.forEach( ( item, index ) => {
		const primary =
			item.options?.type === 'comparison'
				? ( primaryByGroup.get( item.group ) ?? onlyPrimary )
				: undefined;

		if ( primary !== undefined ) {
			pairs.set( index, primary );
		}
	} );

	return pairs;
}

/**
 * The colors a grouped bar chart fills its series with. A comparison takes the lightest tint of its primary's color that keeps 3:1 against the background, and the primary in front of it the shade that keeps 3:1 against that tint. A primary with its own `stroke` keeps it, and a comparison with its own, different `stroke` keeps the pair's colors as given.
 *
 * @param series     - The chart's series.
 * @param colors     - Each series' resolved color.
 * @param background - The hex chart background.
 * @return Each series' fill, by index.
 */
export function getGroupedBarColors(
	series: SeriesData[],
	colors: string[],
	background: string
): string[] {
	const barColors = [ ...colors ];

	getComparisonPrimaries( series ).forEach( ( primary, comparison ) => {
		const base = colors[ primary ];
		const hasOwnColor =
			!! series[ comparison ].options?.stroke &&
			colors[ comparison ].toLowerCase() !== base.toLowerCase();

		// A paint such as `currentColor` or `url(#gradient)` cannot be toned, so the pair keeps the colors it was given.
		if ( hasOwnColor || ! isValidHexColor( base ) || ! isValidHexColor( background ) ) {
			return;
		}

		const tint = tintWithContrast( base, background );
		barColors[ comparison ] = tint;

		if ( ! series[ primary ].options?.stroke ) {
			barColors[ primary ] = shadeWithContrast( base, tint, background );
		}
	} );

	return barColors;
}
