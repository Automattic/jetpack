/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { PostingActivityWindowControl } from '../navigation-control';
import { getPostingActivityHeatmapRange } from '../range';
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

	it( 'renders the trailing year when posting activity is sparse', async () => {
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
		expect( grid ).toHaveAttribute( 'aria-colcount', '53' );
		expect( screen.getAllByTestId( 'heatmap-cell' ) ).toHaveLength( 371 );
		expect( screen.getByLabelText( 'Thu, Jun 25, 2026: 3' ) ).toBeInTheDocument();
	} );
} );

describe( 'getPostingActivityHeatmapRange', () => {
	it( 'uses a trailing year ending at the report end date', () => {
		expect( getPostingActivityHeatmapRange( '2026-07-09T23:59:59.999+02:00' ) ).toEqual( {
			queryStartDate: '2025-07-10',
			queryEndDate: '2026-07-09',
			startDate: '2025-07-10',
			endDate: '2026-07-09',
			compact: true,
			hasNavigation: false,
		} );
	} );

	it( 'uses a larger non-compact visible window when the tile is large enough', () => {
		expect(
			getPostingActivityHeatmapRange( '2026-07-09T23:59:59.999+02:00', {
				contentWidth: 370,
				contentHeight: 370,
			} )
		).toEqual( {
			queryStartDate: '2025-07-10',
			queryEndDate: '2026-07-09',
			startDate: '2026-06-08',
			endDate: '2026-07-09',
			compact: false,
			hasNavigation: true,
		} );
	} );

	it( 'uses compact cells in tighter tiles while still paging through the year', () => {
		expect(
			getPostingActivityHeatmapRange( '2026-07-09T23:59:59.999+02:00', {
				contentWidth: 220,
				contentHeight: 400,
			} )
		).toEqual( {
			queryStartDate: '2025-07-10',
			queryEndDate: '2026-07-09',
			startDate: '2026-04-06',
			endDate: '2026-07-09',
			compact: true,
			hasNavigation: true,
		} );
	} );

	it( 'pages through older windows and cycles within the trailing year', () => {
		const rangeOptions = {
			contentWidth: 370,
			contentHeight: 370,
		};

		expect(
			getPostingActivityHeatmapRange( '2026-07-09T23:59:59.999+02:00', {
				...rangeOptions,
				windowOffset: 1,
			} )
		).toEqual( {
			queryStartDate: '2025-07-10',
			queryEndDate: '2026-07-09',
			startDate: '2026-05-04',
			endDate: '2026-06-07',
			compact: false,
			hasNavigation: true,
		} );

		expect(
			getPostingActivityHeatmapRange( '2026-07-09T23:59:59.999+02:00', {
				...rangeOptions,
				windowOffset: 11,
			} )
		).toEqual(
			getPostingActivityHeatmapRange( '2026-07-09T23:59:59.999+02:00', rangeOptions )
		);
	} );
} );

describe( 'PostingActivityWindowControl', () => {
	it( 'updates the activity window offset with the header arrows', () => {
		const onChange = jest.fn();

		render(
			<PostingActivityWindowControl
				data={ { activityWindowOffset: 2 } }
				onChange={ onChange }
			/>
		);

		fireEvent.click( screen.getByLabelText( 'Show older posting activity' ) );
		expect( onChange ).toHaveBeenCalledWith( { activityWindowOffset: 3 } );

		fireEvent.click( screen.getByLabelText( 'Show newer posting activity' ) );
		expect( onChange ).toHaveBeenCalledWith( { activityWindowOffset: 1 } );
	} );
} );
