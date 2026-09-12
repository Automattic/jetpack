const mockApiFetch = jest.fn();
const mockLineChart = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( options: { path: string } ) => mockApiFetch( options ),
} ) );

jest.mock( '@automattic/charts', () => ( {
	LineChart: props => {
		mockLineChart( props );
		return <div data-testid="subscriber-chart" />;
	},
} ) );

jest.mock( '@automattic/charts/style.css', () => ( {} ), { virtual: true } );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		user: { current_user: { display_name: 'Bob Sacramento' } },
	} ),
} ) );

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SubscriberStatsChart from '..';

const subscribersResponse = {
	fields: [ 'period', 'subscribers', 'subscribers_paid' ],
	data: [
		[ '2026-09-10', 122, 8 ],
		[ '2026-09-09', 120, 7 ],
	],
};

const recentPostsResponse = {
	posts: [
		{
			id: 7,
			title: 'Sent newsletter',
			status: 'publish',
			date: '2026-07-23T12:00:00+00:00',
			url: 'https://example.com/sent-newsletter/',
			image: 'https://example.com/image.jpg',
			recipients: 122,
			openRatePercent: 58,
			clickRatePercent: 21,
		},
	],
	emailTotals: { sends: 200, uniqueOpens: 116, uniqueClicks: 42 },
	viewAllUrl: 'https://example.com/wp-admin/edit.php',
	createPostUrl: 'https://example.com/wp-admin/post-new.php',
};

/**
 * Render Stats with an isolated query cache.
 */
function renderStats(): void {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );

	render(
		<QueryClientProvider client={ queryClient }>
			<SubscriberStatsChart />
		</QueryClientProvider>
	);
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockLineChart.mockReset();
	mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
		if ( path.includes( '/stats/subscribers' ) ) {
			return Promise.resolve( subscribersResponse );
		}
		if ( path === '/jetpack/v4/newsletter/stats/recent-posts' ) {
			return Promise.resolve( recentPostsResponse );
		}
		if ( path.includes( '/emails/summary' ) ) {
			return Promise.resolve( { posts: [] } );
		}
		return Promise.reject( new Error( `Unexpected request: ${ path }` ) );
	} );
} );

describe( 'SubscriberStatsChart', () => {
	it( 'loads subscriber and recent-post data and renders the supplied post metrics', async () => {
		renderStats();

		await expect( screen.findByText( 'Recent Posts' ) ).resolves.toBeInTheDocument();
		await expect(
			screen.findByRole( 'link', { name: 'Sent newsletter' } )
		).resolves.toHaveAttribute( 'href', 'https://example.com/sent-newsletter/' );
		expect( screen.getAllByText( '122' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( '58%' ) ).not.toHaveLength( 0 );
		expect( screen.getAllByText( '21%' ) ).not.toHaveLength( 0 );
		expect( screen.getByTestId( 'subscriber-chart' ) ).toBeInTheDocument();

		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: '/jetpack/v4/newsletter/stats/recent-posts',
			} );
		} );
		expect( mockApiFetch.mock.calls ).not.toContainEqual( [
			expect.objectContaining( { path: expect.stringContaining( '/emails/summary' ) } ),
		] );
		expect( mockLineChart ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: [
					expect.objectContaining( {
						label: 'Subscribers',
						data: [
							{ dateString: '2026-09-09', value: 120 },
							{ dateString: '2026-09-10', value: 122 },
						],
					} ),
					expect.objectContaining( {
						label: 'Paid subscribers',
						data: [
							{ dateString: '2026-09-09', value: 7 },
							{ dateString: '2026-09-10', value: 8 },
						],
					} ),
				],
			} )
		);
	} );

	it( 'shows the loading state before the subscribers request resolves', () => {
		mockApiFetch.mockImplementation( () => new Promise( () => {} ) );

		renderStats();

		expect( screen.getByText( 'Loading subscriber stats…' ) ).toBeInTheDocument();
	} );

	it( 'shows an error with a working retry when the subscribers request fails', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
			if ( path.includes( '/stats/subscribers' ) ) {
				return Promise.reject( new Error( 'network error' ) );
			}
			return Promise.resolve( recentPostsResponse );
		} );

		renderStats();

		await expect(
			screen.findByText( 'Subscriber stats could not be loaded.' )
		).resolves.toBeInTheDocument();

		const subscribersCallsBeforeRetry = mockApiFetch.mock.calls.filter( ( [ { path } ] ) =>
			path.includes( '/stats/subscribers' )
		).length;

		// This direct callback test does not need user-event's pointer simulation.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		await waitFor( () => {
			const subscribersCallsAfterRetry = mockApiFetch.mock.calls.filter( ( [ { path } ] ) =>
				path.includes( '/stats/subscribers' )
			).length;
			expect( subscribersCallsAfterRetry ).toBeGreaterThan( subscribersCallsBeforeRetry );
		} );
	} );

	it( 'shows the empty state when no subscriber data points are returned', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
			if ( path.includes( '/stats/subscribers' ) ) {
				return Promise.resolve( { fields: [ 'period', 'subscribers' ], data: [] } );
			}
			return Promise.resolve( recentPostsResponse );
		} );

		renderStats();

		await expect(
			screen.findByText( 'No subscriber data is available for this period.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'subscriber-chart' ) ).not.toBeInTheDocument();
	} );
} );
