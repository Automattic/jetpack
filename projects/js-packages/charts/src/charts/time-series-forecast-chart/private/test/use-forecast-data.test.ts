import { renderHook } from '@testing-library/react';
import { useForecastData } from '../use-forecast-data';
import type { TimeSeriesForecastAccessors } from '../../types';

type TestDatum = {
	date: Date;
	value: number;
	lower?: number | null;
	upper?: number | null;
};

const accessors: TimeSeriesForecastAccessors< TestDatum > = {
	x: d => d.date,
	y: d => d.value,
	yLower: d => d.lower ?? null,
	yUpper: d => d.upper ?? null,
};

const accessorsNoBounds: TimeSeriesForecastAccessors< TestDatum > = {
	x: d => d.date,
	y: d => d.value,
};

describe( 'useForecastData', () => {
	test( 'returns safe defaults for empty data', () => {
		const { result } = renderHook( () =>
			useForecastData( {
				data: [],
				accessors,
				forecastStart: new Date( '2024-01-15' ),
			} )
		);

		expect( result.current.allPoints ).toEqual( [] );
		expect( result.current.historical ).toEqual( [] );
		expect( result.current.forecast ).toEqual( [] );
		expect( result.current.bandData ).toEqual( [] );
		expect( result.current.yDomain ).toEqual( [ 0, 100 ] );
	} );

	test( 'sorts unsorted input by date', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-20' ), value: 30 },
			{ date: new Date( '2024-01-05' ), value: 10 },
			{ date: new Date( '2024-01-10' ), value: 20 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors: accessorsNoBounds,
				forecastStart: new Date( '2024-02-01' ),
			} )
		);

		const dates = result.current.allPoints.map( p => p.date.getTime() );
		expect( dates ).toEqual( [
			new Date( '2024-01-05' ).getTime(),
			new Date( '2024-01-10' ).getTime(),
			new Date( '2024-01-20' ).getTime(),
		] );
	} );

	test( 'transition point at forecastStart appears in both historical and forecast', () => {
		const forecastStart = new Date( '2024-01-10' );
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 10 },
			{ date: new Date( '2024-01-10' ), value: 20 },
			{ date: new Date( '2024-01-15' ), value: 30 },
		];

		const { result } = renderHook( () =>
			useForecastData( { data, accessors: accessorsNoBounds, forecastStart } )
		);

		const historicalDates = result.current.historical.map( p => p.date.getTime() );
		const forecastDates = result.current.forecast.map( p => p.date.getTime() );

		expect( historicalDates ).toContain( forecastStart.getTime() );
		expect( forecastDates ).toContain( forecastStart.getTime() );
	} );

	test( 'historical only when forecastStart is after all data', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 10 },
			{ date: new Date( '2024-01-10' ), value: 20 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors: accessorsNoBounds,
				forecastStart: new Date( '2024-02-01' ),
			} )
		);

		expect( result.current.historical ).toHaveLength( 2 );
		expect( result.current.forecast ).toHaveLength( 0 );
		expect( result.current.bandData ).toHaveLength( 0 );
	} );

	test( 'forecast only when forecastStart is before all data', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 10 },
			{ date: new Date( '2024-01-10' ), value: 20 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors: accessorsNoBounds,
				forecastStart: new Date( '2023-12-01' ),
			} )
		);

		expect( result.current.historical ).toHaveLength( 0 );
		expect( result.current.forecast ).toHaveLength( 2 );
	} );

	test( 'band data requires both valid lower AND upper bounds', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 10, lower: 5, upper: 15 },
			{ date: new Date( '2024-01-10' ), value: 20, lower: 15, upper: 25 },
			{ date: new Date( '2024-01-15' ), value: 30, lower: null, upper: 35 },
			{ date: new Date( '2024-01-20' ), value: 40, lower: 35, upper: null },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors,
				forecastStart: new Date( '2024-01-01' ),
			} )
		);

		// Only the first two points have both bounds
		expect( result.current.bandData ).toHaveLength( 2 );
		expect( result.current.bandData[ 0 ] ).toEqual( {
			date: new Date( '2024-01-05' ),
			lower: 5,
			upper: 15,
		} );
		expect( result.current.bandData[ 1 ] ).toEqual( {
			date: new Date( '2024-01-10' ),
			lower: 15,
			upper: 25,
		} );
	} );

	test( 'points with only one bound are in forecast but excluded from bandData', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-10' ), value: 20, lower: 15, upper: null },
			{ date: new Date( '2024-01-15' ), value: 30, lower: null, upper: 35 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors,
				forecastStart: new Date( '2024-01-01' ),
			} )
		);

		expect( result.current.forecast ).toHaveLength( 2 );
		expect( result.current.bandData ).toHaveLength( 0 );
	} );

	test( 'asNumber guard treats NaN and Infinity as null', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-10' ), value: 20, lower: NaN, upper: 25 },
			{ date: new Date( '2024-01-15' ), value: 30, lower: 25, upper: Infinity },
			{ date: new Date( '2024-01-20' ), value: 40, lower: -Infinity, upper: 45 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors,
				forecastStart: new Date( '2024-01-01' ),
			} )
		);

		// None have both valid lower AND upper after asNumber guard
		expect( result.current.bandData ).toHaveLength( 0 );

		// But all are in forecast (they're still valid points)
		expect( result.current.forecast ).toHaveLength( 3 );
	} );

	test( 'yDomain includes band bounds beyond just values', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 50, lower: 10, upper: 90 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors,
				forecastStart: new Date( '2024-01-01' ),
			} )
		);

		const [ yMin, yMax ] = result.current.yDomain;
		// Lower bound (10) should pull yMin below value (50)
		expect( yMin ).toBeLessThan( 10 );
		// Upper bound (90) should push yMax above value (50)
		expect( yMax ).toBeGreaterThan( 90 );
	} );

	test( 'yDomain has minimum padding of 1 for flat data', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 50 },
			{ date: new Date( '2024-01-10' ), value: 50 },
			{ date: new Date( '2024-01-15' ), value: 50 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors: accessorsNoBounds,
				forecastStart: new Date( '2024-02-01' ),
			} )
		);

		const [ yMin, yMax ] = result.current.yDomain;
		// Padding should be at least 1 even though range is 0
		expect( yMax - yMin ).toBeGreaterThanOrEqual( 2 );
		expect( yMin ).toBe( 49 );
		expect( yMax ).toBe( 51 );
	} );

	test( 'originalIndex preserves pre-sort position', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-20' ), value: 30 }, // index 0 in input
			{ date: new Date( '2024-01-05' ), value: 10 }, // index 1 in input
			{ date: new Date( '2024-01-10' ), value: 20 }, // index 2 in input
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors: accessorsNoBounds,
				forecastStart: new Date( '2024-02-01' ),
			} )
		);

		// After sorting by date: Jan 5 (idx 1), Jan 10 (idx 2), Jan 20 (idx 0)
		expect( result.current.allPoints[ 0 ].originalIndex ).toBe( 1 );
		expect( result.current.allPoints[ 1 ].originalIndex ).toBe( 2 );
		expect( result.current.allPoints[ 2 ].originalIndex ).toBe( 0 );
	} );

	test( 'band data only comes from forecast region', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 10, lower: 5, upper: 15 },
			{ date: new Date( '2024-01-15' ), value: 20, lower: 15, upper: 25 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors,
				forecastStart: new Date( '2024-01-10' ),
			} )
		);

		// First point is historical (before forecastStart), so only the second appears in bandData
		expect( result.current.bandData ).toHaveLength( 1 );
		expect( result.current.bandData[ 0 ].date.getTime() ).toBe(
			new Date( '2024-01-15' ).getTime()
		);
	} );

	test( 'xDomain spans the full date range', () => {
		const data: TestDatum[] = [
			{ date: new Date( '2024-01-05' ), value: 10 },
			{ date: new Date( '2024-01-20' ), value: 30 },
		];

		const { result } = renderHook( () =>
			useForecastData( {
				data,
				accessors: accessorsNoBounds,
				forecastStart: new Date( '2024-01-10' ),
			} )
		);

		expect( result.current.xDomain[ 0 ].getTime() ).toBe( new Date( '2024-01-05' ).getTime() );
		expect( result.current.xDomain[ 1 ].getTime() ).toBe( new Date( '2024-01-20' ).getTime() );
	} );
} );
