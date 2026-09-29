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

	it.each( [ '', undefined ] )(
		'retains rows with country code %s through the real data pipeline',
		async countryCode => {
			const views = [
				{ location: 'United States', country_code: 'US', views: 10 },
				{ location: false, country_code: countryCode, views: 4 },
			];
			mockApiFetch.mockResolvedValue( {
				date: '2026-06-16',
				days: { '2026-06-16': { views } },
				summary: { views },
			} );

			const { result } = renderHook(
				() => useLocationViews( { reportParams: getDefaultQueryParams( false ), max: 10 } ),
				{ wrapper: queryClientWrapper }
			);

			await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
			expect( result.current.data ).toEqual( [
				expect.objectContaining( { label: 'United States', countryCode: 'US', value: 10 } ),
				expect.objectContaining( { label: 'Unknown', countryCode: '', value: 4 } ),
			] );
		}
	);
} );
