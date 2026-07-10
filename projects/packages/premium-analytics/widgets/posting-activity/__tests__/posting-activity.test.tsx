/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

	it( 'resets the activity window offset after the widget size changes', async () => {
		const setAttributes = jest.fn();
		const resizeCallbacks: ResizeObserverCallback[] = [];
		const originalResizeObserver = globalThis.ResizeObserver;
		const rect = {
			width: 500,
			height: 500,
			top: 0,
			right: 500,
			bottom: 500,
			left: 0,
			x: 0,
			y: 0,
			toJSON: () => {},
		} as DOMRect;
		const getBoundingClientRect = jest
			.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
			.mockReturnValue( rect );

		globalThis.ResizeObserver = class {
			constructor( callback: ResizeObserverCallback ) {
				resizeCallbacks.push( callback );
			}
			observe = jest.fn();
			disconnect = jest.fn();
			unobserve = jest.fn();
		} as unknown as typeof ResizeObserver;

		try {
			render(
				<PostingActivityWidget
					attributes={ {
						activityWindowOffset: 2,
						activityWindowMaxOffset: 7,
						reportParams: {
							from: '2026-06-10T00:00:00.000+02:00',
							to: '2026-07-09T23:59:59.999+02:00',
							interval: 'day',
							preset: 'last-30-days',
							date_type: 'created',
						},
					} }
					setAttributes={ setAttributes }
				/>
			);

			await expect(
				screen.findByRole( 'grid', { name: 'Heatmap chart' } )
			).resolves.toBeInTheDocument();
			await waitFor( () => expect( resizeCallbacks.length ).toBeGreaterThan( 0 ) );
			expect( setAttributes ).not.toHaveBeenCalled();

			await act( async () => {
				resizeCallbacks.forEach( callback => {
					callback(
						[
							{
								contentRect: { width: 370, height: 370 },
							} as ResizeObserverEntry,
						],
						{} as ResizeObserver
					);
				} );
			} );

			await waitFor( () =>
				expect( setAttributes ).toHaveBeenCalledWith( {
					activityWindowOffset: 0,
					activityWindowMaxOffset: 10,
				} )
			);
		} finally {
			getBoundingClientRect.mockRestore();
			globalThis.ResizeObserver = originalResizeObserver;
		}
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
			windowOffset: 0,
			maxWindowOffset: 0,
			canNavigateOlder: false,
			canNavigateNewer: false,
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
			windowOffset: 0,
			maxWindowOffset: 10,
			canNavigateOlder: true,
			canNavigateNewer: false,
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
			windowOffset: 0,
			maxWindowOffset: 3,
			canNavigateOlder: true,
			canNavigateNewer: false,
		} );
	} );

	it( 'pages through older windows and clamps within the trailing year', () => {
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
			windowOffset: 1,
			maxWindowOffset: 10,
			canNavigateOlder: true,
			canNavigateNewer: true,
		} );

		expect(
			getPostingActivityHeatmapRange( '2026-07-09T23:59:59.999+02:00', {
				...rangeOptions,
				windowOffset: 11,
			} )
		).toEqual( {
			queryStartDate: '2025-07-10',
			queryEndDate: '2026-07-09',
			startDate: '2025-07-10',
			endDate: '2025-07-27',
			compact: false,
			hasNavigation: true,
			windowOffset: 10,
			maxWindowOffset: 10,
			canNavigateOlder: false,
			canNavigateNewer: true,
		} );
	} );
} );

describe( 'PostingActivityWindowControl', () => {
	it( 'updates the activity window offset with the header arrows', () => {
		const onChange = jest.fn();

		render(
			<PostingActivityWindowControl
				data={ { activityWindowOffset: 2, activityWindowMaxOffset: 3 } }
				onChange={ onChange }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByLabelText( 'Show older posting activity' ) );
		expect( onChange ).toHaveBeenCalledWith( { activityWindowOffset: 3 } );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByLabelText( 'Show newer posting activity' ) );
		expect( onChange ).toHaveBeenCalledWith( { activityWindowOffset: 1 } );
	} );

	it( 'disables the header arrows at the activity window ends', () => {
		const onChange = jest.fn();
		const { rerender } = render(
			<PostingActivityWindowControl
				data={ { activityWindowOffset: 0, activityWindowMaxOffset: 3 } }
				onChange={ onChange }
			/>
		);

		expect( screen.getByLabelText( 'Show older posting activity' ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByLabelText( 'Show newer posting activity' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		rerender(
			<PostingActivityWindowControl
				data={ { activityWindowOffset: 3, activityWindowMaxOffset: 3 } }
				onChange={ onChange }
			/>
		);

		expect( screen.getByLabelText( 'Show older posting activity' ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByLabelText( 'Show newer posting activity' ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
