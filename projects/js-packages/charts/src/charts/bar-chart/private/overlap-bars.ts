import { MIN_BACKGROUND_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { isValidHexColor, mixHexColors } from '../../../utils/color-utils';
import type { SeriesData } from '../../../types';

export const PRIMARY_SLOT = 'primary';
export const COMPARISON_SLOT = 'comparison';

const OVERLAP_SLOTS = [ PRIMARY_SLOT, COMPARISON_SLOT ] as const;

/** Thickness of the front-most layer, as a share of its slot. */
const FRONT_THICKNESS = 0.5;

const SEARCH_STEPS = 16;

/** Where a series sits in an overlap layout. */
export type OverlapPlacement = {
	slot: ( typeof OVERLAP_SLOTS )[ number ];
	/** 0 for the first `group` in the data, which is drawn at the back. */
	layer: number;
	/** The bar's thickness as a share of its slot. */
	thickness: number;
};

/**
 * Places each series of an overlap layout: primaries in one slot and comparisons in the other, with each `group` a layer, back to front in order of first appearance.
 *
 * @param series - The series to place.
 * @return Each series' placement, by index.
 */
export function getOverlapPlacements( series: SeriesData[] ): OverlapPlacement[] {
	const layerByGroup = new Map< string | undefined, number >();

	series.forEach( ( { group } ) => {
		if ( ! layerByGroup.has( group ) ) {
			layerByGroup.set( group, layerByGroup.size );
		}
	} );

	const layerCount = layerByGroup.size;

	return series.map( item => {
		const layer = layerByGroup.get( item.group ) ?? 0;

		return {
			slot: item.options?.type === 'comparison' ? COMPARISON_SLOT : PRIMARY_SLOT,
			layer,
			thickness: layerCount > 1 ? 1 - ( layer * ( 1 - FRONT_THICKNESS ) ) / ( layerCount - 1 ) : 1,
		};
	} );
}

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

const opposite = ( end: string ): string => ( end === '#000000' ? '#ffffff' : '#000000' );

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
 * The tone of a color nearest the original that keeps 3:1 against the bar it is drawn over, on the far side of that bar from the background when that side can reach 3:1.
 *
 * @param color      - A hex color.
 * @param under      - The hex color of the bar behind it.
 * @param background - The hex chart background.
 * @return A hex color.
 */
export function shadeWithContrast( color: string, under: string, background: string ): string {
	const passes = ( tone: string ) => contrastRatio( tone, under ) >= MIN_BACKGROUND_CONTRAST;
	// Starting from a color on the background's side of `under` would cross it, so the search could not tell which side it ended on.
	const start =
		contrastRatio( color, background ) > contrastRatio( under, background ) ? color : under;

	if ( passes( start ) ) {
		return start;
	}

	const away = awayFrom( background );

	return blendToEdge( start, passes( away ) ? away : opposite( away ), passes );
}

/**
 * The colors an overlap layout fills its series with: per slot, the back layer tinted to 3:1 against the background and each layer in front shaded to 3:1 against the one behind. A slot whose front-most series has its own `stroke` keeps its colors as given.
 *
 * @param series     - Every series of the chart.
 * @param colors     - Each series' resolved color.
 * @param slotColors - The palette color of each slot, primaries first.
 * @param background - The hex chart background.
 * @return Each series' fill, by index.
 */
export function getOverlapBarColors(
	series: SeriesData[],
	colors: string[],
	slotColors: readonly [ string, string ],
	background: string
): string[] {
	const placements = getOverlapPlacements( series );
	const barColors = [ ...colors ];

	OVERLAP_SLOTS.forEach( ( slot, slotIndex ) => {
		const members = placements.flatMap( ( placement, index ) =>
			placement.slot === slot ? [ { index, layer: placement.layer } ] : []
		);

		if ( ! members.length ) {
			return;
		}

		const layers = [ ...new Set( members.map( ( { layer } ) => layer ) ) ].sort(
			( a, b ) => a - b
		);
		const back = members.find( ( { layer } ) => layer === layers[ 0 ] );
		const base =
			back && series[ back.index ].options?.stroke ? colors[ back.index ] : slotColors[ slotIndex ];
		const isFrontStroked = members.some(
			( { index, layer } ) =>
				layer === layers[ layers.length - 1 ] && !! series[ index ].options?.stroke
		);

		// A paint such as `currentColor` or `url(#gradient)` cannot be toned, so the slot keeps the colors it was given.
		if ( isFrontStroked || ! isValidHexColor( base ) || ! isValidHexColor( background ) ) {
			return;
		}

		const toneByLayer = new Map< number, string >();
		let under: string | undefined;

		layers.forEach( layer => {
			const tone =
				under === undefined
					? tintWithContrast( base, background )
					: shadeWithContrast( base, under, background );
			toneByLayer.set( layer, tone );
			under = tone;
		} );

		members.forEach( ( { index, layer } ) => {
			barColors[ index ] = toneByLayer.get( layer ) ?? colors[ index ];
		} );
	} );

	return barColors;
}
