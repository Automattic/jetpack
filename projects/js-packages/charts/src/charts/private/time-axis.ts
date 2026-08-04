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

// Nominal point spacing for a caller-declared bucket resolution. A month maps
// to the shortest month so the month-or-coarser regime engages (see
// getFormatter). Year is absent: it short-circuits to year ticks before the
// spacing regimes run.
const SPACING_BY_RESOLUTION: Record< Exclude< TickResolution, 'year' >, number > = {
	hour: 1,
	day: 24,
	week: 24 * 7,
	month: 28 * 24,
};

// Pick the most informative tick formatter for the data's resolution and time
// span: hours within a day, hours with day boundaries for sub-daily data
// spanning up to a week, calendar dates for daily-or-finer buckets within a
// year, months (with the year at January) for month-or-coarser buckets,
// otherwise just years. The resolution comes from `tickResolution` when the
// caller knows it, and is inferred from point spacing otherwise.
export const getFormatter = (
	sortedData: ReturnType< typeof useChartDataTransform >,
	tickResolution?: TickResolution
) => {
	// The month regime only prints the year at January boundaries, so yearly
	// buckets starting mid-year would render as month names; year ticks are
	// correct for yearly buckets at any span.
	if ( tickResolution === 'year' ) {
		return formatYearTick;
	}

	const minX = Math.min( ...sortedData.map( datom => datom.data.at( 0 )?.date ) );
	const maxX = Math.max( ...sortedData.map( datom => datom.data.at( -1 )?.date ) );

	const spacingInHours = tickResolution
		? SPACING_BY_RESOLUTION[ tickResolution ]
		: getPointSpacingInHours( sortedData );
	// 23, not 24: a daily gap shrinks to 23 wall-clock hours across a
	// spring-forward DST transition.
	const isSubDaily = spacingInHours < 23;

	const diffInHours = Math.abs( differenceInHours( maxX, minX ) );
	if ( diffInHours <= 24 && isSubDaily ) {
		return formatHourTick;
	}

	if ( diffInHours <= 24 * 7 && isSubDaily ) {
		return formatDateOrHourTick;
	}

	const diffInYears = Math.abs( differenceInYears( maxX, minX ) );
	if ( diffInYears <= 1 ) {
		// 28 days: the shortest month, so monthly buckets qualify but weekly
		// don't. The finiteness check keeps all-single-point series — whose
		// resolution is unknowable — on date ticks.
		return Number.isFinite( spacingInHours ) && spacingInHours >= 28 * 24
			? formatMonthOrYearTick
			: formatDateTick;
	}

	return formatYearTick;
};

// Estimate the largest number of x-axis ticks that fit without producing
// consecutive duplicate labels under the given formatter. Used so the axis
// adapts to the data's resolution rather than picking a fixed count.
export const guessOptimalNumTicks = (
	data: ReturnType< typeof useChartDataTransform >,
	chartWidth: number,
	tickFormatter: ( timestamp: number, index?: number, values?: unknown ) => string
) => {
	const minX = Math.min( ...data.map( datom => datom.data.at( 0 )?.date ) );
	const maxX = Math.max( ...data.map( datom => datom.data.at( -1 )?.date ) );
	const xScale = scaleTime( { domain: [ minX, maxX ] } );

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
