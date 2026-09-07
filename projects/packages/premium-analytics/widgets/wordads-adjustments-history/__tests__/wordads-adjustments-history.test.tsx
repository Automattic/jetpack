/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import WordAdsAdjustmentsHistory from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'WordAdsAdjustmentsHistory', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		// Only the adjustment breakdown has rows: reading its single period back
		// pins that this widget renders `adjustment`, not another breakdown.
		mockApiFetch.mockResolvedValue( {
			earnings: {
				total_earnings: '120.00',
				total_amount_owed: '30.00',
				wordads: {},
				sponsored: {},
				adjustment: { '2026-04': { amount: '2.47', pageviews: 0, status: 2 } },
			},
		} );
	} );

	it( 'renders the adjustment breakdown rather than another breakdown', async () => {
		render( <WordAdsAdjustmentsHistory attributes={ {} } /> );
		await expect( screen.findByText( '04-2026' ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows a breakdown-specific empty state when there are no adjustments', async () => {
		mockApiFetch.mockResolvedValue( {
			earnings: {
				total_earnings: '120.00',
				total_amount_owed: '30.00',
				wordads: { '2026-07': { amount: '30.00', pageviews: 20000, status: 0 } },
				sponsored: {},
				adjustment: {},
			},
		} );
		render( <WordAdsAdjustmentsHistory attributes={ {} } /> );
		await expect(
			screen.findByText( 'No earnings adjustments to show yet.' )
		).resolves.toBeInTheDocument();
	} );
} );
