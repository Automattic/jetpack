/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useEarningsReportRecords } from './use-report-records';
import type { StatsWordAdsEarnings } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsWordAdsEarnings: jest.fn(),
} ) );

const mockUseStatsWordAdsEarnings = jest.mocked( useStatsWordAdsEarnings );

const EARNINGS: StatsWordAdsEarnings = {
	total_earnings: 4000,
	total_amount_owed: 1000,
	wordads: {
		'2026-09': { amount: 3889.84, pageviews: 1414489, status: 0 },
		'2026-08': { amount: 3277.37, pageviews: 1365570, status: 1 },
	},
	sponsored: {},
	adjustment: {
		'2026-06': { amount: -50, pageviews: 0, status: 1 },
	},
};

/**
 * Point the mocked query at a payload.
 *
 * @param data - The earnings payload, or undefined while it loads.
 */
function mockEarnings( data: StatsWordAdsEarnings | undefined ) {
	mockUseStatsWordAdsEarnings.mockReturnValue( {
		data,
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
	} as never );
}

describe( 'useEarningsReportRecords', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'reports the wordads bucket on the WordAds tab', () => {
		mockEarnings( EARNINGS );

		const { result } = renderHook( () => useEarningsReportRecords( 'wordads' ) );

		expect( result.current.tab ).toBe( 'wordads' );
		expect( result.current.rows ).toEqual( [
			{ id: '2026-09', period: '2026-09', amount: 3889.84, pageviews: 1414489, status: 0 },
			{ id: '2026-08', period: '2026-08', amount: 3277.37, pageviews: 1365570, status: 1 },
		] );
	} );

	it( 'reports the adjustment bucket on the Adjustments tab', () => {
		mockEarnings( EARNINGS );

		const { result } = renderHook( () => useEarningsReportRecords( 'adjustments' ) );

		expect( result.current.tab ).toBe( 'adjustments' );
		expect( result.current.rows ).toEqual( [
			{ id: '2026-06', period: '2026-06', amount: -50, pageviews: 0, status: 1 },
		] );
	} );

	it( 'offers WordAds plus the tabs whose bucket has rows', () => {
		mockEarnings( EARNINGS );

		const { result } = renderHook( () => useEarningsReportRecords( 'wordads' ) );

		expect( result.current.availableTabs ).toEqual( [ 'wordads', 'adjustments' ] );
	} );

	it( 'offers WordAds even when only an adjustment bucket has rows', () => {
		mockEarnings( { ...EARNINGS, wordads: {} } );

		const { result } = renderHook( () => useEarningsReportRecords( 'wordads' ) );

		expect( result.current.availableTabs ).toEqual( [ 'wordads', 'adjustments' ] );
		expect( result.current.tab ).toBe( 'wordads' );
		expect( result.current.rows ).toEqual( [] );
	} );

	it( 'falls back to WordAds when the asked-for bucket is empty', () => {
		mockEarnings( EARNINGS );

		const { result } = renderHook( () => useEarningsReportRecords( 'sponsored' ) );

		expect( result.current.tab ).toBe( 'wordads' );
		expect( result.current.rows.map( row => row.period ) ).toEqual( [ '2026-09', '2026-08' ] );
	} );

	it( 'trusts the asked-for tab until the payload arrives', () => {
		mockEarnings( undefined );

		const { result } = renderHook( () => useEarningsReportRecords( 'adjustments' ) );

		expect( result.current.tab ).toBe( 'adjustments' );
		expect( result.current.rows ).toEqual( [] );
		expect( result.current.availableTabs ).toEqual( [ 'wordads' ] );
	} );
} );
