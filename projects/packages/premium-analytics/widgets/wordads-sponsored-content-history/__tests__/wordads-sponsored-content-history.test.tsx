/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import WordAdsSponsoredContentHistory from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'WordAdsSponsoredContentHistory', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		// The wordads breakdown has rows while sponsored has none: the empty state
		// must key off this widget's own breakdown, not whether the payload as a
		// whole is empty.
		mockApiFetch.mockResolvedValue( {
			earnings: {
				total_earnings: '120.00',
				total_amount_owed: '30.00',
				wordads: { '2026-07': { amount: '30.00', pageviews: 20000, status: 0 } },
				sponsored: {},
				adjustment: {},
			},
		} );
	} );

	it( 'shows a breakdown-specific empty state when sponsored content has no rows', async () => {
		render( <WordAdsSponsoredContentHistory attributes={ {} } /> );
		await expect(
			screen.findByText( 'No sponsored content earnings to show yet.' )
		).resolves.toBeInTheDocument();
	} );
} );
