import { getTickDecimalsDomain } from '../../private/tick-decimals';
import { categoryKey } from './category';
import { EMPTY_DOMAIN, getBarValue } from './value-domain';
import type { DataPointDate, SeriesData } from '../../../types';

/** Where a bar runs along the value axis: from where the stack reached before it, to where it ends. */
export type StackSegment = { start: number; end: number };

/** The comparison series a stacked layout sums into one bar, and the key that bar is drawn under. */
export type ComparisonTotal = { key: string; series: SeriesData[] };

/** The one source of a stacked layout's value-axis positions, for its bars, ring, tooltip and domain. */
export type StackLayout = {
	/** Where a series' bar runs at a datum's category; undefined when that datum has no reading. */
	segmentOf: ( key: string, datum: DataPointDate ) => StackSegment | undefined;
	/** The lowest negative sum and highest positive sum at the datum's category, both including 0, of the bar `key` is drawn in. */
	extentAt: ( category: DataPointDate, key?: string ) => [ number, number ];
	/** The widest `extentAt` over every category and bar, or null without a finite value. */
	extent: [ number, number ] | null;
};

type Extents = Map< string, [ number, number ] >;

/**
 * Sums the series at each category, positives and negatives apart, calling `onSegment` with where each reading runs.
 *
 * @param series    - The series to stack, bottom first.
 * @param onSegment - Receives each reading's series, category and segment.
 * @return The extent at each category.
 */
function stackSeries(
	series: SeriesData[],
	onSegment?: ( label: string, key: string, segment: StackSegment ) => void
): Extents {
	const extents: Extents = new Map();

	for ( const { label, data } of series ) {
		const seen = new Set< string >();
		for ( const point of data as DataPointDate[] ) {
			const value = getBarValue( point );
			const key = categoryKey( point );
			// A repeated category is invalid data; skipping it keeps the bars, total and tooltip in step.
			if ( ! Number.isFinite( value ) || seen.has( key ) ) {
				continue;
			}
			seen.add( key );
			const extent = extents.get( key ) ?? [ 0, 0 ];
			const side = value < 0 ? 0 : 1;
			const start = extent[ side ];
			extent[ side ] = start + value;
			extents.set( key, extent );
			onSegment?.( label, key, { start, end: start + value } );
		}
	}

	return extents;
}

/**
 * Stacks the series in order at each category: positives upward and negatives downward from zero. Comparisons are summed the same way into one bar of their own.
 *
 * @param series     - The series to stack, bottom first.
 * @param comparison - The comparison series to sum, and the key their bar is drawn under.
 * @return The stack layout.
 */
export function getStackLayout( series: SeriesData[], comparison?: ComparisonTotal ): StackLayout {
	const segments = new Map< string, Map< string, StackSegment > >(
		series.map( ( { label } ) => [ label, new Map() ] )
	);
	const extents = stackSeries( series, ( label, key, segment ) =>
		segments.get( label )?.set( key, segment )
	);
	const comparisonExtents: Extents = comparison ? stackSeries( comparison.series ) : new Map();

	if ( comparison ) {
		// One bar spans both sides, so it ends where the positives do, or the negatives without any.
		segments.set(
			comparison.key,
			new Map(
				[ ...comparisonExtents ].map( ( [ key, [ low, high ] ] ) => [
					key,
					high > 0 ? { start: low, end: high } : { start: 0, end: low },
				] )
			)
		);
	}

	let extent: [ number, number ] | null = null;
	for ( const [ low, high ] of [ ...extents.values(), ...comparisonExtents.values() ] ) {
		extent = extent
			? [ Math.min( extent[ 0 ], low ), Math.max( extent[ 1 ], high ) ]
			: [ low, high ];
	}

	return {
		segmentOf: ( key, datum ) => segments.get( key )?.get( categoryKey( datum ) ),
		extentAt: ( category, key ) => {
			const byCategory = key !== undefined && key === comparison?.key ? comparisonExtents : extents;
			const [ low, high ] = byCategory.get( categoryKey( category ) ) ?? [ 0, 0 ];
			return [ low, high ];
		},
		extent,
	};
}

/**
 * The series of a comparison total: at each category the comparisons have a reading, the net of their readings.
 *
 * @param comparisons - The comparison series to sum.
 * @param label       - The total's label.
 * @return The total, a comparison series named `label`.
 */
export function getComparisonTotalSeries( comparisons: SeriesData[], label: string ): SeriesData {
	const totals = new Map< string, DataPointDate >();

	for ( const { data } of comparisons ) {
		const seen = new Set< string >();
		for ( const point of data as DataPointDate[] ) {
			const key = categoryKey( point );
			const value = getBarValue( point );
			if ( seen.has( key ) ) {
				continue;
			}
			seen.add( key );
			const total = totals.get( key );
			if ( ! total ) {
				totals.set( key, { ...point, value: Number.isFinite( value ) ? value : null } );
			} else if ( Number.isFinite( value ) ) {
				total.value = ( total.value ?? 0 ) + value;
			}
		}
	}

	return { label, data: [ ...totals.values() ], options: { type: 'comparison' } };
}

/**
 * The value domain of a computed stack, falling back to an empty chart's domain.
 *
 * @param stack        - The precomputed stack.
 * @param tickDecimals - The value axis precision, when set.
 * @return The extent widened for tick precision, or the empty chart domain.
 */
export function getStackedValueDomain(
	stack: StackLayout,
	tickDecimals?: number
): [ number, number ] {
	const { extent } = stack;
	const domain: [ number, number ] =
		! extent || extent[ 0 ] === extent[ 1 ] ? [ ...EMPTY_DOMAIN ] : extent;
	return getTickDecimalsDomain( domain, tickDecimals ) ?? domain;
}
