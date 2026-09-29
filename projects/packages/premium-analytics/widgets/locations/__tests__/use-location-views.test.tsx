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

	it( 'keeps rows Stats cannot place as unknown countries', async () => {
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
			result.current.data.map( row => [ row.label, row.countryCode, row.countryFull, row.value ] )
		).toEqual( [
			[ 'United States', 'US', 'United States', 10 ],
			[ 'Unknown', '', 'Unknown', 4 ],
			[ 'Unknown', '', 'Unknown', 3 ],
		] );
	} );
} );
