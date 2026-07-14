/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { WidgetRoot } from '../../widget-root';
import { WordAdsEarningsHistoryWidget } from '../wordads-earnings-history-widget';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws (see top-posts.test.tsx).
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const EARNINGS = {
	earnings: {
		total_earnings: '120.00',
		total_amount_owed: '30.00',
		wordads: {
			'2026-06': { amount: '90.00', pageviews: 60000, status: 1 },
			'2026-07': { amount: '30.00', pageviews: 20000, status: 0 },
		},
		sponsored: {},
		adjustment: {},
	},
};

function renderWidget( breakdown: 'wordads' | 'sponsored' | 'adjustment' ) {
	return render(
		<WidgetRoot attributes={ {} }>
			<WordAdsEarningsHistoryWidget breakdown={ breakdown } />
		</WidgetRoot>
	);
}

beforeEach( () => {
	queryClient.clear();
	mockApiFetch.mockResolvedValue( EARNINGS );
} );

it( 'renders earnings rows newest-first with formatted currency and status', async () => {
	renderWidget( 'wordads' );
	await expect( screen.findByText( '07-2026' ) ).resolves.toBeInTheDocument();
	expect( screen.getByText( '$30.00' ) ).toBeInTheDocument();
	expect( screen.getByText( 'Unpaid' ) ).toBeInTheDocument();
	expect( screen.getByText( 'Paid' ) ).toBeInTheDocument();
} );

it( 'shows the empty state when the chosen breakdown is empty', async () => {
	renderWidget( 'sponsored' );
	await expect( screen.findByText( /No earnings history/i ) ).resolves.toBeInTheDocument();
} );
