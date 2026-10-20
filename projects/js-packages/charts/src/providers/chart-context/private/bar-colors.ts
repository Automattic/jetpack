import { isValidHexColor, mixHexColors } from '../../../utils/color-utils';
import { MIN_BACKGROUND_CONTRAST } from './palette-generator';
import { contrastRatio } from './perceptual-color';
import type { SeriesData } from '../../../types';

const SEARCH_STEPS = 16;

/**
 * Blends `from` toward `to` and returns the blend nearest the point where `passes` changes, on its passing side.
 *
 * @param from   - Where the blend starts.
 * @param to     - Where the blend ends.
 * @param passes - A test that changes at most once along the blend.
 * @return A hex color.
 */
function blendToEdge( from: string, to: string, passes: ( color: string ) => boolean ): string {
	const passesAtStart = passes( from );
	let low = 0;
	let high = 1;

	for ( let step = 0; step < SEARCH_STEPS; step++ ) {
		const middle = ( low + high ) / 2;

		if ( passes( mixHexColors( from, to, middle ) ) === passesAtStart ) {
			low = middle;
		} else {
			high = middle;
		}
	}

	return mixHexColors( from, to, passesAtStart ? low : high );
}

const awayFrom = ( background: string ): string =>
	contrastRatio( background, '#000000' ) >= contrastRatio( background, '#ffffff' )
		? '#000000'
		: '#ffffff';

/**
 * The tone of a color nearest the background that keeps 3:1 against it.
 *
 * @param color      - A hex color.
 * @param background - The hex chart background.
 * @return A hex color.
 */
export function tintWithContrast( color: string, background: string ): string {
	const passes = ( tone: string ) => contrastRatio( tone, background ) >= MIN_BACKGROUND_CONTRAST;

	return blendToEdge( color, passes( color ) ? background : awayFrom( background ), passes );
}

/**
 * A color, or the tone of it nearest the original that keeps 3:1 against a bar it is drawn over.
 *
 * @param color - A hex color.
 * @param under - The hex color of the bar behind it.
 * @return A hex color.
 */
export function shadeWithContrast( color: string, under: string ): string {
	const passes = ( tone: string ) => contrastRatio( tone, under ) >= MIN_BACKGROUND_CONTRAST;

	return passes( color ) ? color : blendToEdge( color, awayFrom( under ), passes );
}

/**
 * Pairs each comparison series with the primary of its `group`, or with the only primary.
 *
 * @param series - The chart's series.
 * @return The index of each paired comparison's primary, keyed by the comparison's index.
 */
export function getComparisonPrimaries( series: SeriesData[] ): Map< number, number > {
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
 * The colors a bar chart fills its series with. A comparison without a `stroke` in a color of its own takes the lightest tint of its primary's color that keeps 3:1 against the background, and its primary darkens until it keeps 3:1 against that tint.
 *
 * @param series     - The chart's series.
 * @param colors     - Each series' resolved color.
 * @param background - The hex chart background.
 * @return Each series' fill, by index.
 */
export function getBarColors(
	series: SeriesData[],
	colors: string[],
	background: string
): string[] {
	const barColors = [ ...colors ];

	getComparisonPrimaries( series ).forEach( ( primary, comparison ) => {
		const hasOwnColor =
			!! series[ comparison ].options?.stroke &&
			colors[ comparison ].toLowerCase() !== colors[ primary ].toLowerCase();
		// A paint such as `currentColor` or `url(#gradient)` cannot be toned, so the pair keeps the colors it was given.
		if (
			hasOwnColor ||
			! isValidHexColor( colors[ primary ] ) ||
			! isValidHexColor( background )
		) {
			return;
		}

		const tint = tintWithContrast( colors[ primary ], background );
		barColors[ comparison ] = tint;
		barColors[ primary ] = shadeWithContrast( colors[ primary ], tint );
	} );

	return barColors;
}
