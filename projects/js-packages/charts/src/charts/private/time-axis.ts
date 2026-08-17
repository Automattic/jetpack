import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { scaleTime } from '@visx/scale';
import { differenceInHours, differenceInYears } from 'date-fns';
import type { useChartDataTransform } from '../../hooks';
import type { TickResolution } from '../../types';
import type { CurveType } from '../line-chart/types';

// Approximate min pixel width for an x-axis tick label.
const X_TICK_WIDTH = 60;

// Resolve the visx curve generator for a given `curveType` / `smoothing`
// combination. Shared by LineChart and AreaChart so the two render
// identically when given the same props.
//
// Explicit return type avoids a TS2742 portable-name error in the .d.ts
// build: the inferred type traces back to `@types/d3-shape` (a transitive
// dep), but `typeof curveLinear` resolves through `@visx/curve` which we
// own directly.
export const getCurveType = ( type?: CurveType, smoothing?: boolean ): typeof curveLinear => {
	if ( ! type ) {
		return smoothing ? curveCatmullRom : curveLinear;
	}

	switch ( type ) {
		case 'smooth':
			return curveCatmullRom;
		case 'monotone':
			return curveMonotoneX;
		case 'linear':
			return curveLinear;
		default:
			return curveLinear;
	}
};

const formatYearTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, { year: 'numeric' } );
};

const formatDateTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, { month: 'short', day: 'numeric' } );
};

const formatHourTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleTimeString( undefined, { hour: 'numeric', hour12: true } );
};

// Hour ticks with the date at midnight boundaries, so multi-day spans of
// sub-daily data keep their days identifiable.
const formatDateOrHourTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.getHours() === 0 && date.getMinutes() === 0
		? formatDateTick( timestamp )
		: formatHourTick( timestamp );
};

// Month ticks with the year at January boundaries, for month-or-coarser
// buckets where a full "Sep 1" date would misread as a daily point.
const formatMonthOrYearTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.getMonth() === 0
		? formatYearTick( timestamp )
		: date.toLocaleDateString( undefined, { month: 'short' } );
};

// Overall time span of the data. Series with no dated points are dropped rather
// than folded in: an empty comparison series is legitimate, and one undefined
// bound would turn the whole span into NaN. Null when nothing is dated.
const getSpan = ( sortedData: ReturnType< typeof useChartDataTransform > ) => {
	const bounds = sortedData
		.map( datom => [ datom.data.at( 0 )?.date, datom.data.at( -1 )?.date ] )
		.filter( ( [ first, last ] ) => first !== undefined && last !== undefined );

	if ( ! bounds.length ) {
		return null;
	}

	return {
		minX: Math.min( ...bounds.map( ( [ first ] ) => Number( first ) ) ),
		maxX: Math.max( ...bounds.map( ( [ , last ] ) => Number( last ) ) ),
	};
};

// Smallest interval between consecutive points across all series, in hours.
// Infinity when no series has two points.
const getPointSpacingInHours = ( sortedData: ReturnType< typeof useChartDataTransform > ) => {
	return sortedData.reduce(
		( spacing, datom ) =>
			datom.data.reduce( ( seriesSpacing, point, index ) => {
				const previous = datom.data[ index - 1 ];
				if ( previous?.date === undefined || point?.date === undefined ) {
					return seriesSpacing;
				}
				return Math.min(
					seriesSpacing,
					Math.abs( differenceInHours( point.date, previous.date ) )
				);
			}, spacing ),
		Number.POSITIVE_INFINITY
	);
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
// buckets as far as labelling goes.
export const getBucketResolution = (
	sortedData: ReturnType< typeof useChartDataTransform >,
	tickResolution?: TickResolution
): Exclude< TickResolution, 'week' > => {
	if ( tickResolution ) {
		return tickResolution === 'week' ? 'day' : tickResolution;
	}

	const spacingInHours = getPointSpacingInHours( sortedData );
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

// Pick the most informative tick formatter for the data's bucket resolution and
// time span. Month-or-coarser buckets are formatted from the resolution alone —
// they carry no day to print at any span — while finer buckets narrow with the
// span: hours within a day, hours with day boundaries for sub-daily data
// spanning up to a week, calendar dates within a year, otherwise years.
export const getFormatter = (
	sortedData: ReturnType< typeof useChartDataTransform >,
	tickResolution?: TickResolution
) => {
	const resolution = getBucketResolution( sortedData, tickResolution );

	// The month regime only prints the year at January boundaries, so yearly
	// buckets starting mid-year would render as bare month names.
	if ( resolution === 'year' ) {
		return formatYearTick;
	}

	if ( resolution === 'month' ) {
		return formatMonthOrYearTick;
	}

	const span = getSpan( sortedData );
	if ( ! span ) {
		return formatDateTick;
	}

	const diffInHours = Math.abs( differenceInHours( span.maxX, span.minX ) );
	if ( resolution === 'hour' ) {
		if ( diffInHours <= 24 ) {
			return formatHourTick;
		}
		if ( diffInHours <= 24 * 7 ) {
			return formatDateOrHourTick;
		}
	}

	// Beyond a year, dates repeat often enough under tick sampling that the year
	// is the only part worth printing.
	return Math.abs( differenceInYears( span.maxX, span.minX ) ) <= 1
		? formatDateTick
		: formatYearTick;
};

// Estimate the largest number of x-axis ticks that fit without producing
// consecutive duplicate labels under the given formatter. Used so the axis
// adapts to the data's resolution rather than picking a fixed count.
export const guessOptimalNumTicks = (
	data: ReturnType< typeof useChartDataTransform >,
	chartWidth: number,
	tickFormatter: ( timestamp: number, index?: number, values?: unknown ) => string
) => {
	const span = getSpan( data );
	if ( ! span ) {
		return 1;
	}

	const xScale = scaleTime( { domain: [ span.minX, span.maxX ] } );

	const upperBound = Math.min(
		data[ 0 ]?.data.length || 3,
		Math.ceil( chartWidth / X_TICK_WIDTH )
	);
	let secondBestGuess = 1;

	for ( let numTicks = upperBound; numTicks > 1; --numTicks ) {
		const ticks = xScale.ticks( numTicks ).map( d => tickFormatter( d.getTime() ) );

		if ( ticks.length > upperBound ) continue;

		secondBestGuess = Math.max( secondBestGuess, ticks.length );

		const uniqueTicks = Array.from( new Set( ticks ) );
		if ( uniqueTicks.length === 1 ) return 1;

		const hasConsecutiveDuplicate = ticks.some(
			( tick, idx ) => idx > 0 && tick === ticks[ idx - 1 ]
		);
		if ( hasConsecutiveDuplicate ) continue;

		return ticks.length;
	}

	return secondBestGuess;
};
