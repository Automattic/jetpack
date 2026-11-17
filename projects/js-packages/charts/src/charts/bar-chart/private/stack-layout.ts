import { getTickDecimalsDomain } from '../../private/tick-decimals';
import { categoryKey } from './category';
import { EMPTY_DOMAIN, getBarValue } from './value-domain';
import type { BarChartLayout, DataPointDate, SeriesData } from '../../../types';

/** Where a bar runs along the value axis: from where the stack reached before it, to where it ends. */
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
 * The series a layout draws: a stacked layout leaves comparison series out for now.
 *
 * @param series - The chart's series.
 * @param layout - The layout the bars are drawn in.
 * @return The drawn series.
 */
export function getDrawnSeries< T extends SeriesData >(
	series: T[],
	layout?: BarChartLayout
): T[] {
	return layout === 'stacked'
		? series.filter( item => item.options?.type !== 'comparison' )
		: series;
}

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
			// A repeated category is invalid data; skipping it keeps the bars, total and tooltip in step.
			if ( byCategory.has( key ) ) {
				continue;
			}
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
