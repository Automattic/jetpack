import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { queryClientWrapper } from '../../test-utils';
import useLocationViews from '../use-location-views';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = jest.mocked( apiFetch );

describe( 'useLocationViews', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'keeps rows Stats cannot place as one unknown country', async () => {
		const views = [
			{ location: 'United States', country_code: 'US', views: 10 },
			{ location: false, country_code: 'AP', views: 4 },
			{ location: false, country_code: '-', views: 3 },
		];
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-16',
			days: { '2026-06-16': { views } },
			summary: { views },
			'country-info': {
				US: { country_full: 'United States' },
				AP: { country_full: false },
				'-': { country_full: false },
			},
		} );

		const { result } = renderHook(
			() => useLocationViews( { reportParams: getDefaultQueryParams( false ), max: 10 } ),
			{ wrapper: queryClientWrapper }
		);

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect(
			result.current.data.map( row => [ row.key, row.countryCode, row.countryFull, row.value ] )
		).toEqual( [
			[ 'US:United States', 'US', 'United States', 10 ],
			[ ':Unknown', '', 'Unknown', 7 ],
		] );
	} );

	it( 'returns the same rows across renders, which the widget holds by reference', async () => {
		const views = [ { location: 'Japan', country_code: 'JP', views: 5 } ];
		mockApiFetch.mockResolvedValue( {
			date: '2026-06-16',
			days: { '2026-06-16': { views } },
			summary: { views },
			'country-info': { JP: { country_full: 'Japan' } },
		} );

		const { result, rerender } = renderHook(
			() => useLocationViews( { reportParams: getDefaultQueryParams( false ), max: 10 } ),
			{ wrapper: queryClientWrapper }
		);
		await waitFor( () => expect( result.current.data ).toHaveLength( 1 ) );
		const rows = result.current.data;

		rerender();

		expect( result.current.data ).toBe( rows );
	} );

	it( 'sends the region filter alongside its country', async () => {
		mockApiFetch.mockResolvedValue( {} );

		renderHook(
			() =>
				useLocationViews( {
					reportParams: getDefaultQueryParams( false ),
					max: 10,
					geoMode: 'city',
					filter: { country: 'US', region: 'Minnesota' },
				} ),
			{ wrapper: queryClientWrapper }
		);

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		const requestedPath = decodeURIComponent( mockApiFetch.mock.calls[ 0 ]?.[ 0 ]?.path ?? '' );
		expect( requestedPath ).toContain( 'stats/location-views/city' );
		expect( requestedPath ).toContain( 'filter_by_country=US' );
		expect( requestedPath ).toContain( 'filter_by_region=Minnesota' );
	} );
} );
