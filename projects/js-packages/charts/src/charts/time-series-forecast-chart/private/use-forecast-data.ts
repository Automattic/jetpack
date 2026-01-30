import { useMemo } from 'react';
import type { TimeSeriesForecastAccessors, TransformedForecastPoint, BandPoint } from '../types';

interface UseForecastDataOptions< D > {
	data: readonly D[];
	accessors: TimeSeriesForecastAccessors< D >;
	forecastStart: Date;
}

interface UseForecastDataResult {
	/** All transformed points (no duplicates) - used for tooltip */
	allPoints: TransformedForecastPoint[];
	/** Historical points (before forecastStart) - for visual rendering */
	historical: TransformedForecastPoint[];
	/** Forecast points (at or after forecastStart) - for visual rendering */
	forecast: TransformedForecastPoint[];
	/** Band data for uncertainty region */
	bandData: BandPoint[];
	yDomain: [ number, number ];
	xDomain: [ Date, Date ];
}

/**
 * Safe number extraction - returns null for non-finite numbers
 *
 * @param n - The value to extract as a number
 * @return The number if valid and finite, otherwise null
 */
const asNumber = ( n: number | null | undefined ): number | null => {
	return typeof n === 'number' && Number.isFinite( n ) ? n : null;
};

/**
 * Hook to transform and split forecast data for rendering
 *
 * Handles:
 * - Transforming generic data via accessors
 * - Splitting data into historical and forecast portions
 * - Creating band data for uncertainty regions
 * - Computing x and y domains
 *
 * @param root0               - Options object
 * @param root0.data          - Array of data points
 * @param root0.accessors     - Accessor functions to extract values from data
 * @param root0.forecastStart - Date at which forecast begins
 * @return Transformed data split into historical and forecast portions
 */
export function useForecastData< D >( {
	data,
	accessors,
	forecastStart,
}: UseForecastDataOptions< D > ): UseForecastDataResult {
	return useMemo( () => {
		if ( data.length === 0 ) {
			const now = new Date();
			return {
				historical: [],
				forecast: [],
				bandData: [],
				yDomain: [ 0, 100 ] as [ number, number ],
				xDomain: [ now, now ] as [ Date, Date ],
			};
		}

		// 1. Transform all points via accessors
		const transformed: TransformedForecastPoint[] = data.map( ( d, i ) => ( {
			date: accessors.x( d, i ),
			value: accessors.y( d, i ),
			lower: accessors.yLower ? asNumber( accessors.yLower( d, i ) ) : null,
			upper: accessors.yUpper ? asNumber( accessors.yUpper( d, i ) ) : null,
			originalIndex: i,
		} ) );

		// 2. Sort by date for rendering stability
		transformed.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );

		// 3. Split by forecastStart
		// Both series include the transition point so the lines connect seamlessly visually
		const forecastStartTime = forecastStart.getTime();
		const historical = transformed.filter( p => p.date.getTime() <= forecastStartTime );
		const forecast = transformed.filter( p => p.date.getTime() >= forecastStartTime );

		// 4. Band data: only points with BOTH valid lower AND upper
		const bandData: BandPoint[] = forecast
			.filter(
				( p ): p is TransformedForecastPoint & { lower: number; upper: number } =>
					p.lower !== null && p.upper !== null
			)
			.map( p => ( { date: p.date, lower: p.lower, upper: p.upper } ) );

		// 5. Compute y domain including bounds
		const allValues = transformed.map( p => p.value );
		const allLowers = transformed.map( p => p.lower ).filter( ( v ): v is number => v !== null );
		const allUppers = transformed.map( p => p.upper ).filter( ( v ): v is number => v !== null );

		// Use concat instead of spread to avoid stack overflow on large arrays
		const allYValues = allValues.concat( allLowers, allUppers );
		const minY = allYValues.reduce( ( min, val ) => Math.min( min, val ), Infinity );
		const maxY = allYValues.reduce( ( max, val ) => Math.max( max, val ), -Infinity );

		// Add some padding to y domain (ensure minimum padding to avoid zero-height scales)
		const yPadding = Math.max( ( maxY - minY ) * 0.1, 1 );
		const yDomain: [ number, number ] = [ minY - yPadding, maxY + yPadding ];

		// 6. Compute x domain (use reduce to avoid stack overflow on large arrays)
		const allDateTimes = transformed.map( p => p.date.getTime() );
		const xDomain: [ Date, Date ] = [
			new Date( allDateTimes.reduce( ( min, val ) => Math.min( min, val ), Infinity ) ),
			new Date( allDateTimes.reduce( ( max, val ) => Math.max( max, val ), -Infinity ) ),
		];

		return { allPoints: transformed, historical, forecast, bandData, yDomain, xDomain };
	}, [ data, accessors, forecastStart ] );
}
