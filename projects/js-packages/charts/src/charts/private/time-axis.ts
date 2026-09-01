import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { scaleTime } from '@visx/scale';
import { differenceInHours, differenceInYears } from 'date-fns';
import { createDateFormatter, createZonedClock } from '../../utils/date-formatting';
import type { useChartDataTransform } from '../../hooks';
import type { BucketInfo, ChartFormatting, SeriesData, TickResolution } from '../../types';
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

const YEAR_TICK = { year: 'numeric' } as const;
const DATE_TICK = { month: 'short', day: 'numeric' } as const;
const HOUR_TICK = { hour: 'numeric' } as const;
const MONTH_TICK = { month: 'short' } as const;

/**
 * A tick format, carrying the boundary test that decides its coarser label.
 *
 * A band scale samples by index, so `getBandTickValues` has to steer ticks onto
 * the boundaries a format prints the date or the year at. Hanging the test off
 * the format that branches on it keeps the two from drifting apart.
 */
export type TickFormat = ( ( timestamp: number ) => string ) & {
	isAnchor?: ( date: Date ) => boolean;
};

const boundaryFormat = (
	isAnchor: ( date: Date ) => boolean,
	atBoundary: ( timestamp: number ) => string,
	between: ( timestamp: number ) => string
): TickFormat => {
	const format: TickFormat = ( timestamp: number ) =>
		isAnchor( new Date( timestamp ) ) ? atBoundary( timestamp ) : between( timestamp );
	format.isAnchor = isAnchor;
	return format;
};

// The tick formats, bound to the host's locale and time zone. Built per call
// rather than once per module: both halves are the host's to set, and the
// boundary tests have to read the same clock as the labels they gate.
const tickFormats = ( formatting: ChartFormatting ) => {
	const clock = createZonedClock( formatting.timeZone );
	const year = createDateFormatter( YEAR_TICK, formatting );
	const date = createDateFormatter( DATE_TICK, formatting );
	const hour = createDateFormatter( HOUR_TICK, formatting );
	const month = createDateFormatter( MONTH_TICK, formatting );

	return {
		year,
		date,
		// Hour ticks with the date at midnight boundaries, so multi-day spans of
		// sub-daily data keep their days identifiable.
		dateOrHour: boundaryFormat(
			value => {
				const { hour: hours, minute } = clock( value );
				return hours === 0 && minute === 0;
			},
			date,
			hour
		),
		hour,
		// Month ticks with the year at January boundaries, for month-or-coarser
		// buckets where a full "Sep 1" date would misread as a daily point.
		monthOrYear: boundaryFormat( value => clock( value ).month === 1, year, month ),
	};
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
// Infinity when no series carries two distinct instants.
const getPointSpacingInHours = ( sortedData: ReturnType< typeof useChartDataTransform > ) => {
	return sortedData.reduce( ( spacing, datom ) => {
		// Sorted and deduplicated rather than read in array order: `getBucketInfo`
		// is public, and a repeated instant is padding, not a sub-daily gap.
		const instants = [ ...new Set( datom.data.map( point => point?.date?.getTime() ) ) ]
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

/**
 * How this data was classified, for consumers that render their own labels.
 *
 * @param data           - The series the chart draws, in any order.
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

/**
 * The most informative tick format for a bucket resolution and the span on screen.
 *
 * @param sortedData     - Series as returned by `useChartDataTransform`.
 * @param tickResolution - Caller-declared bucket resolution, when known.
 * @param formatting     - Host locale and time zone.
 * @param domain         - The effective scale domain, or undefined for the data's own extent.
 * @return The formatter the axis labels its ticks with.
 */
export const getFormatter = (
	sortedData: ReturnType< typeof useChartDataTransform >,
	tickResolution?: TickResolution,
	formatting: ChartFormatting = {},
	domain?: [ Date, Date ]
): TickFormat => {
	const format = tickFormats( formatting );
	const resolution = getBucketResolution( sortedData, tickResolution );

	// The month regime only prints the year at January boundaries, so yearly
	// buckets starting mid-year would render as bare month names.
	if ( resolution === 'year' ) {
		return format.year;
	}

	if ( resolution === 'month' ) {
		return format.monthOrYear;
	}

	// Narrowing by span is a readability call about what is on screen, so it reads
	// the domain when there is one; the resolution above stays keyed on the data.
	const span = domain
		? { minX: domain[ 0 ].getTime(), maxX: domain[ 1 ].getTime() }
		: getSpan( sortedData );
	if ( ! span ) {
		return format.date;
	}

	const diffInHours = Math.abs( differenceInHours( span.maxX, span.minX ) );
	if ( resolution === 'hour' ) {
		if ( diffInHours <= 24 ) {
			return format.hour;
		}
		if ( diffInHours <= 24 * 7 ) {
			return format.dateOrHour;
		}
	}

	// Beyond a year, dates repeat often enough under tick sampling that the year
	// is the only part worth printing.
	return Math.abs( differenceInYears( span.maxX, span.minX ) ) <= 1 ? format.date : format.year;
};

/**
 * The instants a set of series spans, as a scale domain.
 *
 * @param sortedData - Series as returned by `useChartDataTransform`.
 * @return Earliest and latest dated point, or undefined when nothing is dated.
 */
export const getSeriesExtent = (
	sortedData: ReturnType< typeof useChartDataTransform >
): [ Date, Date ] | undefined => {
	const span = getSpan( sortedData );
	return span ? [ new Date( span.minX ), new Date( span.maxX ) ] : undefined;
};

// Indices of the buckets whose label carries the coarser unit.
const getAnchorIndices = ( domain: Date[], isAnchor: ( date: Date ) => boolean ) =>
	domain.reduce< number[] >( ( indices, date, index ) => {
		if ( isAnchor( date ) ) {
			indices.push( index );
		}
		return indices;
	}, [] );

// Index strides worth sampling the domain at. Both roundings of each tick count
// are needed: flooring alone skips the stride that fits a mid-series anchor on
// short domains. Anchors add the strides that can land on more than one of them
// — those dividing their spacing, and the smallest whole multiple that still
// fits, which carries spans too long for any divisor to reach.
const getCandidateSteps = ( length: number, maxTicks: number, anchorSpacing: number | null ) => {
	const steps = new Set< number >();
	for ( let count = maxTicks; count > 1; count-- ) {
		steps.add( Math.max( 1, Math.floor( ( length - 1 ) / ( count - 1 ) ) ) );
		steps.add( Math.max( 1, Math.ceil( ( length - 1 ) / ( count - 1 ) ) ) );
	}

	if ( anchorSpacing ) {
		for ( let divisor = 1; divisor <= anchorSpacing; divisor++ ) {
			if ( anchorSpacing % divisor === 0 ) {
				steps.add( anchorSpacing / divisor );
			}
		}
		const minStep = Math.floor( ( length - 1 ) / Math.max( 1, maxTicks ) ) + 1;
		steps.add( Math.ceil( minStep / anchorSpacing ) * anchorSpacing );
	}

	return steps;
};

/**
 * Tick values for a band time axis.
 *
 * visx samples a band domain by index from offset zero, blind to which labels
 * carry a boundary and without collapsing repeats — so the tick that prints the
 * year or the date often isn't sampled at all, and a long series can show the
 * same label twice. Choose the values instead: sweep the evenly spaced
 * candidates, including those that step from anchor to anchor, and keep the one
 * that reaches the most anchors without thinning the axis or putting two
 * identical labels side by side.
 *
 * @param domain        - Band domain, in axis order.
 * @param tickFormatter - Formatter the axis will render these values with.
 * @param maxTicks      - Most ticks the axis should carry.
 * @return Values to hand the axis as `tickValues`.
 */
export const getBandTickValues = (
	domain: Date[],
	tickFormatter: TickFormat,
	maxTicks: number
): Date[] => {
	if ( ! domain.length ) {
		return [];
	}

	const { isAnchor } = tickFormatter;
	const anchorIndices = isAnchor ? getAnchorIndices( domain, isAnchor ) : [];

	// Once per bucket rather than once per bucket per candidate: the sweep reads
	// the same labels back for every step and offset.
	const domainLabels = domain.map( date => tickFormatter( date.getTime() ) );

	const candidates: number[][] = [];
	const consider = ( indices: number[] ) => {
		if ( ! indices.length || indices.length > maxTicks ) {
			return;
		}
		const repeats = indices.some(
			( index, position ) =>
				position > 0 && domainLabels[ index ] === domainLabels[ indices[ position - 1 ] ]
		);
		if ( ! repeats ) {
			candidates.push( indices );
		}
	};

	const anchorSpacing = anchorIndices.length > 1 ? anchorIndices[ 1 ] - anchorIndices[ 0 ] : null;
	for ( const step of getCandidateSteps( domain.length, maxTicks, anchorSpacing ) ) {
		for ( let offset = 0; offset < step; offset++ ) {
			const indices: number[] = [];
			for ( let index = offset; index < domain.length; index += step ) {
				indices.push( index );
			}
			consider( indices );
		}
	}

	// Stepping the anchors themselves rather than the domain, so that anchors an
	// uneven number of buckets apart are still all reachable — a wall-clock day
	// is 23 buckets of hourly data across a spring-forward DST transition, and a
	// fixed stride drifts off midnight for the rest of the span.
	for ( let stride = 1; stride <= anchorIndices.length; stride++ ) {
		consider( anchorIndices.filter( ( _, position ) => position % stride === 0 ) );
	}

	if ( ! candidates.length ) {
		return [ domain[ 0 ] ];
	}

	// An anchor is worth at most one tick. Ranking anchors above density outright
	// collapsed ordinary monthly axes to two ticks — worse than sampling by index,
	// which at least stayed dense — while ignoring anchors leaves the year unnamed.
	const densest = candidates.reduce( ( most, indices ) => Math.max( most, indices.length ), 0 );
	// Re-reading `isAnchor` here would run a time-zone-aware clock once per index
	// per candidate; the indices it would answer for are already known.
	const anchorIndexSet = new Set( anchorIndices );
	const anchorsIn = ( indices: number[] ) =>
		indices.filter( index => anchorIndexSet.has( index ) ).length;

	const best = candidates
		.filter( indices => indices.length >= densest - 1 )
		.reduce( ( chosen, indices ) => {
			const gain = anchorsIn( indices ) - anchorsIn( chosen );
			return gain > 0 || ( gain === 0 && indices.length > chosen.length ) ? indices : chosen;
		} );

	return best.map( index => domain[ index ] );
};

/**
 * The most x-axis ticks a chart of this width has room for.
 *
 * @param chartWidth - Chart width in pixels.
 * @return A tick budget of at least one.
 */
export const getMaxTicksForWidth = ( chartWidth: number ): number =>
	Math.max( 1, Math.floor( chartWidth / X_TICK_WIDTH ) );

/**
 * Tick values for a continuous time axis, chosen from the points it draws.
 *
 * Selected, never constructed: a local time that does not exist cannot be a
 * data point, so DST gaps and overlaps need no special case.
 *
 * @param sortedData    - Series as returned by `useChartDataTransform`.
 * @param domain        - The effective scale domain, or undefined for all data.
 * @param tickFormatter - The formatter the ticks will be labeled with.
 * @param maxTicks      - The most ticks the axis has room for.
 * @return Tick dates, or null when no series carries a usable date.
 */
export const getTimeAxisTickValues = (
	sortedData: ReturnType< typeof useChartDataTransform >,
	domain: [ Date, Date ] | undefined,
	tickFormatter: TickFormat,
	maxTicks: number
): Date[] | null => {
	const byTimestamp = new Map< number, Date >();

	for ( const series of sortedData ) {
		for ( const point of series.data ) {
			const date = ( point as { date?: Date } ).date;
			if ( date instanceof Date && Number.isFinite( date.getTime() ) ) {
				byTimestamp.set( date.getTime(), date );
			}
		}
	}

	if ( ! byTimestamp.size ) {
		return null;
	}

	const min = domain?.[ 0 ]?.getTime();
	const max = domain?.[ 1 ]?.getTime();
	const visible = [ ...byTimestamp.keys() ]
		.sort( ( a, b ) => a - b )
		.filter(
			timestamp =>
				( min === undefined || timestamp >= min ) && ( max === undefined || timestamp <= max )
		)
		.map( timestamp => byTimestamp.get( timestamp ) as Date );

	return getBandTickValues( visible, tickFormatter, maxTicks );
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
