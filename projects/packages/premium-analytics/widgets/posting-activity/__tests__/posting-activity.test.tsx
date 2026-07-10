/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import PostingActivityWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'PostingActivityWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {
			data: {
				[ String( Date.UTC( 2026, 5, 25 ) / 1000 ) ]: 3,
			},
		} );
	} );

	it( 'renders the full selected range when posting activity is sparse', async () => {
		render(
			<PostingActivityWidget
				attributes={ {
					reportParams: {
						from: '2026-06-10T00:00:00.000+02:00',
						to: '2026-07-09T23:59:59.999+02:00',
						interval: 'day',
						preset: 'last-30-days',
						date_type: 'created',
					},
				} }
			/>
		);

		const grid = await screen.findByRole( 'grid', { name: 'Heatmap chart' } );
		expect( grid ).toHaveAttribute( 'aria-colcount', '5' );
		expect( screen.getAllByTestId( 'heatmap-cell' ) ).toHaveLength( 35 );
		expect( screen.getByLabelText( 'Thu, Jun 25, 2026: 3' ) ).toBeInTheDocument();
	} );
} );
