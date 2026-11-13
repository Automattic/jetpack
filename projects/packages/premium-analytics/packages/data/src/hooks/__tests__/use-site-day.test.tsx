/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useSiteDay } from '../use-site-day';

jest.mock( '@jetpack-premium-analytics/datetime', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/datetime' ),
	reportingTimeZone: jest.fn( () => 'UTC' ),
} ) );

describe( 'useSiteDay', () => {
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'keeps the day moving for the others when one subscriber leaves', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T23:59:30.000Z' ) );
		const { unmount } = renderHook( () => useSiteDay() );
		const { result } = renderHook( () => useSiteDay() );

		unmount();
		act( () => {
			jest.advanceTimersByTime( 60 * 1000 );
		} );

		expect( result.current ).toBe( Date.parse( '2026-08-21T00:00:00.000Z' ) );
	} );

	it( 'reads the current day for a subscriber that mounts after everyone left', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T12:00:00.000Z' ) );
		renderHook( () => useSiteDay() ).unmount();

		jest.setSystemTime( Date.parse( '2026-08-22T12:00:00.000Z' ) );
		const { result } = renderHook( () => useSiteDay() );

		expect( result.current ).toBe( Date.parse( '2026-08-22T00:00:00.000Z' ) );
	} );
} );
