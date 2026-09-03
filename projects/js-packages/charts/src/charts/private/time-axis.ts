import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { scaleTime } from '@visx/scale';
import { differenceInHours, differenceInYears } from 'date-fns';
import { getBucketResolution } from '../../utils/bucket-info';
import { createDateFormatter, createZonedClock } from '../../utils/date-formatting';
import type { useChartDataTransform } from '../../hooks';
import type { ChartFormatting, TickResolution } from '../../types';
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
	// Anchors the ticks that open a new label instead. A label changes at the
	// host zone's own boundary, so this needs no clock of its own, and it holds
	// for data that starts partway through a day.
	anchorsAtLabelChange?: boolean;
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

	// A date tick names a whole day, so it belongs at the start of one; without
	// this the stride drifts hours off the boundary it labels.
	const datedTick: TickFormat = ( timestamp: number ) => date( timestamp );
	datedTick.anchorsAtLabelChange = true;

	return {
		year,
		date: datedTick,
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

	// Once per bucket rather than once per bucket per candidate: the sweep reads
	// the same labels back for every step and offset.
	const domainLabels = domain.map( date => tickFormatter( date.getTime() ) );

	const { isAnchor } = tickFormatter;
	let anchorIndices: number[] = [];
	if ( tickFormatter.anchorsAtLabelChange ) {
		anchorIndices = domainLabels.reduce< number[] >( ( indices, label, index ) => {
			if ( index === 0 || label !== domainLabels[ index - 1 ] ) {
				indices.push( index );
			}
			return indices;
		}, [] );
	} else if ( isAnchor ) {
		anchorIndices = getAnchorIndices( domain, isAnchor );
	}

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
	// From the sparsest stride that could still overflow the axis: anything
	// denser is rejected below, and every point opening a new label is an anchor,
	// so the list is as long as the domain on daily data.
	const minStride = Math.max( 1, Math.ceil( anchorIndices.length / maxTicks ) );
	for ( let stride = minStride; stride <= anchorIndices.length; stride++ ) {
		const stepped: number[] = [];
		for ( let position = 0; position < anchorIndices.length; position += stride ) {
			stepped.push( anchorIndices[ position ] );
		}
		consider( stepped );
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

// Closest value in a sorted list.
const nearestValue = ( sorted: number[], target: number ) => {
	let low = 0;
	let high = sorted.length - 1;
	while ( low < high ) {
		const middle = Math.floor( ( low + high ) / 2 );
		if ( sorted[ middle ] < target ) {
			low = middle + 1;
		} else {
			high = middle;
		}
	}
	const above = sorted[ low ];
	const below = low > 0 ? sorted[ low - 1 ] : above;
	return Math.abs( above - target ) <= Math.abs( below - target ) ? above : below;
};

// Ticks chosen by position: step evenly across the domain in time, and take the
// nearest point to each target, preferring an anchor within half a step. A
// target with no point that close keeps its own instant, since a gap in the data
// holds nothing for a tick to align with.
const getPositionTickValues = (
	points: Date[],
	tickFormatter: TickFormat,
	maxTicks: number
): Date[] => {
	const times = points.map( point => point.getTime() );
	const first = times[ 0 ];
	const last = times[ times.length - 1 ];

	if ( maxTicks <= 1 || times.length === 1 || first === last ) {
		return [ points[ 0 ] ];
	}

	const count = Math.min( maxTicks, times.length );
	const step = ( last - first ) / ( count - 1 );
	const { isAnchor } = tickFormatter;
	const anchors = isAnchor ? times.filter( ( _, index ) => isAnchor( points[ index ] ) ) : [];

	const chosen: number[] = [];
	let lastLabel: string | null = null;

	for ( let index = 0; index < count; index++ ) {
		const target = first + index * step;
		const anchor = anchors.length ? nearestValue( anchors, target ) : null;
		let tick = anchor !== null && Math.abs( anchor - target ) <= step / 2 ? anchor : null;

		if ( tick === null ) {
			const point = nearestValue( times, target );
			tick = Math.abs( point - target ) <= step / 2 ? point : target;
		}

		// Two targets can reach for the same anchor, and a snap can land back
		// behind the tick before it.
		const previous = chosen[ chosen.length - 1 ];
		if ( previous !== undefined && ( tick <= previous || tick - previous < step * 0.6 ) ) {
			continue;
		}

		const label = tickFormatter( tick );
		if ( label === lastLabel ) {
			continue;
		}

		chosen.push( tick );
		lastLabel = label;
	}

	return chosen.map( timestamp => new Date( timestamp ) );
};

// An index stride is a pixel stride only while the points are evenly spaced.
// `span / maxTicks` is one label's worth of axis, so a closer pair overlaps, and
// a selection this much thinner than the axis has room for means the
// duplicate-label veto in `getBandTickValues` ate every stride.
const isIndexSamplingUnusable = ( ticks: Date[], points: Date[], maxTicks: number ) => {
	if ( ticks.length < 2 || points.length < 2 ) {
		return false;
	}

	const span = points[ points.length - 1 ].getTime() - points[ 0 ].getTime();
	if ( ! span ) {
		return false;
	}

	const closest = ticks
		.slice( 1 )
		.reduce(
			( nearest, tick, index ) => Math.min( nearest, tick.getTime() - ticks[ index ].getTime() ),
			Infinity
		);

	return (
		closest < ( span / maxTicks ) * 0.9 || ticks.length < Math.min( maxTicks, points.length ) / 3
	);
};

/**
 * Tick values for a continuous time axis, chosen from the points it draws.
 *
 * Sampled by index while the points are evenly spaced, which keeps the axis on
 * the calendar boundaries `getBandTickValues` steers towards, and by position
 * once they are not, where an index stride crowds one end of the scale.
 *
 * Values are taken from the data wherever there is one to take, so a local time
 * that does not exist cannot become a tick and DST needs no special case. Only a
 * target stranded in a gap is constructed, as a plain instant.
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

	const ticks = getBandTickValues( visible, tickFormatter, maxTicks );

	return isIndexSamplingUnusable( ticks, visible, maxTicks )
		? getPositionTickValues( visible, tickFormatter, maxTicks )
		: ticks;
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
