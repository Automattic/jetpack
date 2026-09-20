import { differenceInHours } from 'date-fns';
import { parseAsLocalDate } from './date-parsing';
import type { BucketInfo, DataPoint, DataPointDate, SeriesData, TickResolution } from '../types';

// `dateString` is parsed here too: `getBucketInfo` is public, and hosts call it
// with the raw series, before `useChartDataTransform` has dated the points.
const getInstant = ( point?: DataPointDate | DataPoint ): number | undefined => {
	if ( ! point ) {
		return undefined;
	}
	if ( 'date' in point && point.date ) {
		return point.date.getTime();
	}
	if ( 'dateString' in point && point.dateString ) {
		return parseAsLocalDate( point.dateString ).getTime();
	}
	return undefined;
};

// Smallest interval between consecutive points across all series, in hours.
// Infinity when no series carries two distinct instants.
const getPointSpacingInHours = ( data: SeriesData[] ) => {
	return data.reduce( ( spacing, datom ) => {
		// Sorted and deduplicated rather than read in array order: `getBucketInfo`
		// is public, and a repeated instant is padding, not a sub-daily gap.
		const instants = [ ...new Set( datom.data.map( point => getInstant( point ) ) ) ]
			.filter( ( time ): time is number => time !== undefined && Number.isFinite( time ) )
			.sort( ( a, b ) => a - b );

		return instants.reduce(
			( seriesSpacing, time, index ) =>
				index === 0
					? seriesSpacing
					: Math.min( seriesSpacing, Math.abs( differenceInHours( time, instants[ index - 1 ] ) ) ),
			spacing
		);
	}, Number.POSITIVE_INFINITY );
};

// 23, not 24: a daily gap shrinks to 23 wall-clock hours across a
// spring-forward DST transition.
const SUB_DAILY_SPACING_HOURS = 23;

// The shortest month, so monthly buckets clear it but weekly ones don't.
const MONTHLY_SPACING_HOURS = 28 * 24;

// The bucket size behind the data, as the resolution label the tick formats are
// keyed on. Exported so consumers that label a single point — bar chart
// tooltips — read the same classification the axis does instead of inferring
// the resolution a second way. Weeks report as 'day': both are calendar-date
// buckets as far as labeling goes.
export const getBucketResolution = (
	data: SeriesData[],
	tickResolution?: TickResolution
): Exclude< TickResolution, 'week' > => {
	if ( tickResolution ) {
		return tickResolution === 'week' ? 'day' : tickResolution;
	}

	const spacingInHours = getPointSpacingInHours( data );
	if ( spacingInHours < SUB_DAILY_SPACING_HOURS ) {
		return 'hour';
	}
	// Fewer than two points leaves the spacing unknowable, so fall back to
	// calendar dates rather than reading Infinity as a very coarse bucket.
	if ( ! Number.isFinite( spacingInHours ) || spacingInHours < MONTHLY_SPACING_HOURS ) {
		return 'day';
	}
	// Twelve shortest months: above any monthly gap (31 days at most) and below
	// any yearly one (365 days at least).
	return spacingInHours < 12 * MONTHLY_SPACING_HOURS ? 'month' : 'year';
};

/**
 * How this data was classified, for consumers that render their own labels.
 *
 * @param data           - The series the chart draws, in any order, dated by `date` or `dateString`.
 * @param tickResolution - Caller-declared bucket resolution, when known.
 * @return The declared or inferred bucket, and the resolution formats key on.
 */
export const getBucketInfo = (
	data: SeriesData[],
	tickResolution?: TickResolution
): BucketInfo => ( {
	bucket: tickResolution ?? getBucketResolution( data ),
	displayResolution: getBucketResolution( data, tickResolution ),
} );
