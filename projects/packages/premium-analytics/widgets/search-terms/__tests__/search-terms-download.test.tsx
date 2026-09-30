/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { captureCsvDownloads } from '../../test-utils';
import SearchTermsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'SearchTermsWidget CSV export', () => {
	let downloads: ReturnType< typeof captureCsvDownloads >;

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		downloads = captureCsvDownloads();
	} );

	afterEach( () => {
		jest.useRealTimers();
		downloads.restore();
	} );

	it( 'downloads the full report, Unknown search terms included', async () => {
		const terms = Array.from( { length: 11 }, ( _, index ) => ( {
			term: `term ${ index + 1 }`,
			views: 50 - index,
		} ) );
		mockApiFetch.mockResolvedValue( {
			date: '2026-03-10',
			days: {},
			summary: { search_terms: terms, encrypted_search_terms: 5 },
		} );

		render(
			<SearchTermsWidget
				attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
			/>
		);

		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( await screen.findByRole( 'button', { name: /Download CSV/ } ) );
		await waitFor( () => expect( downloads.files ).toHaveLength( 1 ) );

		const lines = await downloads.lines();
		expect( lines[ 0 ] ).toBe( '"Search term","Views"' );
		expect( lines ).toContain( '"Unknown search terms","5"' );
		expect( lines ).toHaveLength( 13 );
		expect( downloads.files[ 0 ].filename ).toBe( 'search-terms-2026-03-01_2026-03-10.csv' );
	} );
} );
