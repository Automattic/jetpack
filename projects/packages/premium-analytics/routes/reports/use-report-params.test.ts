/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useReportParams } from './use-report-params';

const mockSearch = {
	from: '2026-08-14T00:00:00.000+00:00',
	to: '2026-08-20T23:59:59.999+00:00',
	preset: 'last-7-days',
	interval: 'day',
};

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch,
} ) );

jest.mock( '@jetpack-premium-analytics/datetime', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/datetime' ),
	reportingTimeZone: jest.fn( () => 'UTC' ),
} ) );

describe( 'useReportParams', () => {
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( "moves a preset to the new day after the site's midnight", () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T23:59:30.000Z' ) );
		const { result } = renderHook( () => useReportParams() );
		expect( result.current.from ).toBe( '2026-08-14T00:00:00.000+00:00' );

		act( () => {
			jest.advanceTimersByTime( 60 * 1000 );
		} );

		expect( result.current ).toMatchObject( {
			from: '2026-08-15T00:00:00.000+00:00',
			to: '2026-08-21T23:59:59.999+00:00',
		} );
	} );
} );
