import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { scaleTime } from '@visx/scale';
import { differenceInHours, differenceInYears } from 'date-fns';
import type { useChartDataTransform } from '../../hooks';
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

// Pick the most informative tick formatter for the data's time span: hours
// within a day, calendar dates within a year, otherwise just years.
export const getFormatter = ( sortedData: ReturnType< typeof useChartDataTransform > ) => {
	const minX = Math.min( ...sortedData.map( datom => datom.data.at( 0 )?.date ) );
	const maxX = Math.max( ...sortedData.map( datom => datom.data.at( -1 )?.date ) );

	const diffInHours = Math.abs( differenceInHours( maxX, minX ) );
	if ( diffInHours <= 24 ) {
		return formatHourTick;
	}

	const diffInYears = Math.abs( differenceInYears( maxX, minX ) );
	if ( diffInYears <= 1 ) {
		return formatDateTick;
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
