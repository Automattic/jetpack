/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { enabledTrafficPeriods, useTrafficPeriod } from '../granularity';
import type { ReportParams } from '@jetpack-premium-analytics/data';

function params( overrides: Partial< ReportParams > = {} ): ReportParams {
	return {
		from: '2026-06-01',
		to: '2026-06-30',
		interval: 'day',
		preset: 'last-30-days',
		...overrides,
	};
}

describe( 'enabledTrafficPeriods', () => {
	it( 'narrows to the allowed intervals for the preset', () => {
		expect( enabledTrafficPeriods( params( { preset: 'today' } ) ) ).toEqual(
			new Set( [ 'hour', 'day' ] )
		);
		expect( enabledTrafficPeriods( params( { preset: 'last-7-days' } ) ) ).toEqual(
			new Set( [ 'day' ] )
		);
		expect( enabledTrafficPeriods( params( { preset: 'last-30-days' } ) ) ).toEqual(
			new Set( [ 'day', 'week' ] )
		);
		expect( enabledTrafficPeriods( params( { preset: 'last-90-days' } ) ) ).toEqual(
			new Set( [ 'week', 'month' ] )
		);
	} );

	it( 'collapses quarter/year onto month, the coarsest offered option', () => {
		expect( enabledTrafficPeriods( params( { preset: 'last-12-months' } ) ) ).toEqual(
			new Set( [ 'month' ] )
		);
		expect(
			enabledTrafficPeriods(
				params( {
					preset: undefined,
					from: '2020-01-01T00:00:00.000Z',
					to: '2026-06-30T23:59:59.999Z',
				} )
			)
		).toEqual( new Set( [ 'month' ] ) );
	} );

	it( 'derives from range length when the preset is unknown', () => {
		expect(
			enabledTrafficPeriods(
				params( {
					preset: undefined,
					from: '2026-06-01T00:00:00.000Z',
					to: '2026-06-01T23:59:59.999Z',
				} )
			)
		).toEqual( new Set( [ 'hour', 'day' ] ) );
	} );
} );

describe( 'useTrafficPeriod', () => {
	it( 'keeps an explicit granularity the range allows', () => {
		const setAttributes = jest.fn();
		const { result } = renderHook( () => useTrafficPeriod( 'week', params(), setAttributes ) );

		expect( result.current ).toBe( 'week' );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the range default and resets a disallowed granularity', () => {
		const setAttributes = jest.fn();
		const { result } = renderHook( () => useTrafficPeriod( 'hour', params(), setAttributes ) );

		expect( result.current ).toBe( 'day' );
		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( setAttributes ).toHaveBeenCalledWith( { granularity: 'auto' } );
	} );

	it( 'renders as auto without crashing when the host cannot write attributes', () => {
		const { result } = renderHook( () => useTrafficPeriod( 'hour', params() ) );

		expect( result.current ).toBe( 'day' );
	} );

	it( 'follows the dashboard interval on auto, including hourly', () => {
		const setAttributes = jest.fn();
		const { result: hourlyResult } = renderHook( () =>
			useTrafficPeriod( 'auto', params( { preset: 'today', interval: 'hour' } ), setAttributes )
		);
		const { result: quarterlyResult } = renderHook( () =>
			useTrafficPeriod(
				'auto',
				params( { preset: 'last-12-months', interval: 'quarter' } ),
				setAttributes
			)
		);

		expect( hourlyResult.current ).toBe( 'hour' );
		expect( quarterlyResult.current ).toBe( 'month' );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );
