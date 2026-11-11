/**
 * External dependencies
 */
import { useStatsDevicesPeriods } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import useDeviceViewsOverTime from '../use-device-views-over-time';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsDevicesPeriods: jest.fn(),
} ) );

const mockUseStatsDevicesPeriods = jest.mocked( useStatsDevicesPeriods );
const PARAMS = { from: '2026-06-01', to: '2026-06-07' } as ReportParams;
const ROW = { date_start: '2026-06-01T00:00:00', date_end: '2026-06-01T23:59:59' };

function mockReport( {
	primary,
	comparison,
	isError = false,
}: {
	primary?: Record< string, unknown >;
	comparison?: Record< string, unknown >;
	isError?: boolean;
} ) {
	mockUseStatsDevicesPeriods.mockReturnValue( {
		primary: { data: primary },
		comparison: { data: comparison },
		hasComparison: !! comparison,
		timezone: 'UTC',
		periodStarts: undefined,
		isLoading: false,
		isFetching: false,
		isError,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useStatsDevicesPeriods > );
}

describe( 'useDeviceViewsOverTime', () => {
	// A device the current period never saw still adds its previous views to the previous total.
	it( 'stacks desktop, mobile and tablet first, then the rest by views, from either period', () => {
		mockReport( {
			primary: { summary: { tablet: 5, other: 9, mobile: 20, desktop: 40, ...ROW }, data: [] },
			comparison: { summary: { phone: 3, desktop: 30, ...ROW }, data: [] },
		} );

		const { result } = renderHook( () => useDeviceViewsOverTime( PARAMS, 'day' ) );

		expect( result.current.devices.map( device => device.key ) ).toEqual( [
			'desktop',
			'mobile',
			'tablet',
			'other',
			'phone',
		] );
	} );

	it.each( [
		[ 'keeps the bars when a refetch of drawn data fails', [ { ...ROW, desktop: 1 } ], false ],
		[ 'reports an error when there is nothing drawn', [], true ],
	] )( '%s', ( _case, data, isError ) => {
		mockReport( { primary: { summary: { desktop: 1, ...ROW }, data }, isError: true } );

		const { result } = renderHook( () => useDeviceViewsOverTime( PARAMS, 'day' ) );

		expect( result.current.isError ).toBe( isError );
	} );
} );
