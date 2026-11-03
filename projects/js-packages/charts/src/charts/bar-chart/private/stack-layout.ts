import { categoryKey } from './category';
import { EMPTY_DOMAIN, getBarValue } from './value-domain';
import type { DataPointDate, SeriesData } from '../../../types';

/** Where a bar runs along the value axis, from the stack below it to its own top. */
export type StackSegment = { start: number; end: number };

/** The one source of a stacked layout's value-axis positions, for its bars, ring, tooltip and domain. */
export type StackLayout = {
	/** Where a series' bar runs at a datum's category; undefined when that datum has no reading. */
	segmentOf: ( key: string, datum: DataPointDate ) => StackSegment | undefined;
	/** The lowest negative sum and highest positive sum at the datum's category, both including 0. */
	extentAt: ( category: DataPointDate ) => [ number, number ];
	/** The widest `extentAt` over every category, or null without a finite value. */
	extent: [ number, number ] | null;
};

/**
 * Stacks the series in order at each category: positives upward and negatives downward from zero.
 *
 * @param series - The series to stack, bottom first.
 * @return The stack layout.
 */
export function getStackLayout( series: SeriesData[] ): StackLayout {
	const segments = new Map< string, Map< string, StackSegment > >();
	const extents = new Map< string, [ number, number ] >();

	for ( const { label, data } of series ) {
		const byCategory = new Map< string, StackSegment >();
		segments.set( label, byCategory );
		for ( const point of data as DataPointDate[] ) {
			const value = getBarValue( point );
			if ( ! Number.isFinite( value ) ) {
				continue;
			}
			const key = categoryKey( point );
			const extent = extents.get( key ) ?? [ 0, 0 ];
			const side = value < 0 ? 0 : 1;
			const start = extent[ side ];
			extent[ side ] = start + value;
			extents.set( key, extent );
			byCategory.set( key, { start, end: start + value } );
		}
	}

	let extent: [ number, number ] | null = null;
	for ( const [ low, high ] of extents.values() ) {
		extent = extent
			? [ Math.min( extent[ 0 ], low ), Math.max( extent[ 1 ], high ) ]
			: [ low, high ];
	}

	return {
		segmentOf: ( key, datum ) => segments.get( key )?.get( categoryKey( datum ) ),
		extentAt: category => {
			const [ low, high ] = extents.get( categoryKey( category ) ) ?? [ 0, 0 ];
			return [ low, high ];
		},
		extent,
	};
}

/**
 * The value domain of a stacked layout: its tallest stacks, always spanning zero.
 *
 * @param data             - The series to stack, bottom first.
 * @param isSeriesRendered - Whether visx mounts a series, i.e. the legend shows it.
 * @return The value domain.
 */
export function getStackedValueDomain(
	data: SeriesData[],
	isSeriesRendered: ( series: SeriesData ) => boolean
): [ number, number ] {
	const extent = getStackLayout( data.filter( isSeriesRendered ) ).extent;
	return ! extent || extent[ 0 ] === extent[ 1 ] ? [ ...EMPTY_DOMAIN ] : extent;
}
