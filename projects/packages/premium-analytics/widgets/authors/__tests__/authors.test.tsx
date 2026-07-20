/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import AuthorsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'AuthorsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {
			date: '2026-07-17',
			period: 'day',
			summary: { authors: [] },
		} );
	} );

	it( 'passes max zero through to request all authors', async () => {
		render(
			<AuthorsWidget
				attributes={ { max: 0, reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
			/>
		);

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: expect.stringMatching( /[?&]max=0(?:&|$)/ ),
				} )
			)
		);
	} );
} );
