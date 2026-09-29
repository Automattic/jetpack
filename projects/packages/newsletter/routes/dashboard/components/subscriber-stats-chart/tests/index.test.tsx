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

jest.mock( '@wordpress/date', () => ( {
	dateI18n: () => '2026-09-21',
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		user: { current_user: { display_name: 'Bob Sacramento' } },
	} ),
	getSiteType: () => 'jetpack',
} ) );

const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
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

const currentTotalsResponse = {
	fields: [ 'period', 'subscribers', 'subscribers_paid' ],
	data: [ [ '2026-09-21', 200, 15 ] ],
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

/**
 * Stub stats fetches. The headline totals request always returns today's count.
 *
 * @param subscribers - Response for the chart-window request.
 */
function mockStatsFetch( subscribers: ( path: string ) => unknown ): void {
	mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
		if ( path.includes( 'quantity=1&' ) ) {
			return Promise.resolve( currentTotalsResponse );
		}
		if ( path.includes( '/stats/subscribers' ) ) {
			return subscribers( path );
		}
		if ( path === '/wpcom/v2/newsletter/stats/recent-posts' ) {
			return Promise.resolve( recentPostsResponse );
		}
		if ( path.includes( '/emails/summary' ) ) {
			return Promise.resolve( { posts: [] } );
		}
		return Promise.reject( new Error( `Unexpected request: ${ path }` ) );
	} );
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockLineChart.mockReset();
	mockRecordEvent.mockReset();
	mockStatsFetch( () => Promise.resolve( subscribersResponse ) );
} );

describe( 'SubscriberStatsChart', () => {
	it( 'loads subscriber and recent-post data and renders the supplied post metrics', async () => {
		renderStats();

		await expect( screen.findByText( 'Recent Posts' ) ).resolves.toBeInTheDocument();
		await expect(
			screen.findByRole( 'link', { name: 'Sent newsletter' } )
		).resolves.toHaveAttribute( 'href', 'https://example.com/sent-newsletter/' );
		expect( screen.getByText( '200' ) ).toBeInTheDocument();
		expect( screen.getByText( '15' ) ).toBeInTheDocument();
		expect( screen.getAllByText( '122' ) ).toHaveLength( 1 );
		expect( screen.getAllByText( '58%' ) ).not.toHaveLength( 0 );
		expect( screen.getAllByText( '21%' ) ).not.toHaveLength( 0 );
		expect( screen.getByTestId( 'subscriber-chart' ) ).toBeInTheDocument();

		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( '/wpcom/v2/newsletter/stats/subscribers' ),
			} );
		} );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: expect.stringContaining( 'unit=day&quantity=30&date=2026-09-21' ),
		} );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: expect.stringContaining(
				`unit=day&quantity=1&date=${ new Date().toISOString().slice( 0, 10 ) }`
			),
		} );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/newsletter/stats/recent-posts',
		} );
		expect( screen.getByLabelText( 'Subscribers with a paid subscription.' ) ).toBeInTheDocument();
		expect( mockApiFetch.mock.calls ).not.toContainEqual( [
			expect.objectContaining( { path: expect.stringContaining( '/emails/summary' ) } ),
		] );
		expect( mockLineChart ).toHaveBeenCalledWith(
			expect.objectContaining( {
				options: expect.objectContaining( {
					axis: expect.objectContaining( {
						x: { tickResolution: 'day' },
					} ),
				} ),
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

	it( 'shows the loading state before the subscribers request resolves', async () => {
		mockApiFetch.mockImplementation( () => new Promise( () => {} ) );

		renderStats();

		await expect( screen.findByText( 'Loading subscriber stats…' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Days' } ) ).toBeInTheDocument();
	} );

	it( 'shows an error with a working retry when the subscribers request fails', async () => {
		mockStatsFetch( () => Promise.reject( new Error( 'network error' ) ) );

		renderStats();

		await expect(
			screen.findByText( 'Subscriber stats could not be loaded.' )
		).resolves.toBeInTheDocument();
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_stats_state_view', {
			site_type: 'jetpack',
			area: 'subscribers',
			state: 'error',
		} );

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
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_stats_retry_click', {
			site_type: 'jetpack',
			area: 'subscribers',
		} );
	} );

	it( 'shows the empty state when no subscriber data points are returned', async () => {
		mockStatsFetch( () => Promise.resolve( { fields: [ 'period', 'subscribers' ], data: [] } ) );

		renderStats();

		await expect(
			screen.findByText( 'No subscriber data is available for this period.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( '200' ) ).toBeInTheDocument();
		expect( screen.getByText( '15' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'subscriber-chart' ) ).not.toBeInTheDocument();
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_stats_state_view', {
			site_type: 'jetpack',
			area: 'subscribers',
			state: 'empty',
		} );
	} );

	it( 'requests the Stats subscribers window for the selected unit', async () => {
		renderStats();

		await expect( screen.findByRole( 'radio', { name: 'Weeks' } ) ).resolves.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_newsletter_stats_interval_click',
			expect.anything()
		);
		// ToggleGroupControl is a radio group; this asserts the query, not pointer behavior.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Weeks' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_stats_interval_click', {
			site_type: 'jetpack',
			interval: 'week',
		} );
		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( 'unit=week&quantity=12' ),
			} );
		} );
		expect( mockLineChart ).toHaveBeenCalledWith(
			expect.objectContaining( {
				options: expect.objectContaining( {
					axis: expect.objectContaining( {
						x: { tickResolution: 'week' },
					} ),
				} ),
			} )
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Years' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_stats_interval_click', {
			site_type: 'jetpack',
			interval: 'year',
		} );
		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( 'unit=year&quantity=3' ),
			} );
		} );
	} );

	it( 'turns week and year period labels into chart dates', async () => {
		mockStatsFetch( path => {
			if ( path.includes( 'unit=week' ) ) {
				return Promise.resolve( {
					fields: [ 'period', 'subscribers', 'subscribers_paid' ],
					data: [ [ '2026W09W14', 40, 2 ] ],
				} );
			}
			if ( path.includes( 'unit=year' ) ) {
				return Promise.resolve( {
					fields: [ 'period', 'subscribers', 'subscribers_paid' ],
					data: [ [ '2026', 50, 3 ] ],
				} );
			}
			return Promise.resolve( subscribersResponse );
		} );

		renderStats();

		await expect( screen.findByRole( 'radio', { name: 'Weeks' } ) ).resolves.toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Weeks' } ) );

		await waitFor( () => {
			expect( mockLineChart ).toHaveBeenCalledWith(
				expect.objectContaining( {
					data: [
						expect.objectContaining( {
							data: [ { dateString: '2026-09-14', value: 40 } ],
						} ),
						expect.objectContaining( {
							data: [ { dateString: '2026-09-14', value: 2 } ],
						} ),
					],
				} )
			);
		} );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Years' } ) );

		await waitFor( () => {
			expect( mockLineChart ).toHaveBeenCalledWith(
				expect.objectContaining( {
					data: [
						expect.objectContaining( {
							data: [ { dateString: '2026-01-01', value: 50 } ],
						} ),
						expect.objectContaining( {
							data: [ { dateString: '2026-01-01', value: 3 } ],
						} ),
					],
				} )
			);
		} );
	} );

	it( 'parses labels with the response unit and leaves missing counts empty', async () => {
		mockStatsFetch( () =>
			Promise.resolve( {
				unit: 'week',
				fields: [ 'period', 'subscribers', 'subscribers_paid' ],
				data: [ [ '2026W09W14', null, 2 ] ],
			} )
		);

		renderStats();

		await waitFor( () => {
			expect( mockLineChart ).toHaveBeenCalledWith(
				expect.objectContaining( {
					options: expect.objectContaining( {
						axis: expect.objectContaining( {
							x: { tickResolution: 'week' },
						} ),
					} ),
					data: [
						expect.objectContaining( {
							data: [ { dateString: '2026-09-14', value: null } ],
						} ),
						expect.objectContaining( {
							data: [ { dateString: '2026-09-14', value: 2 } ],
						} ),
					],
				} )
			);
		} );
		expect( screen.getByText( '200' ) ).toBeInTheDocument();
		expect( screen.getByText( '15' ) ).toBeInTheDocument();
	} );

	it( 'keeps the subscriber totals while the next interval is loading', async () => {
		let resolveWeek: ( value: unknown ) => void = () => {};
		mockStatsFetch( path => {
			if ( path.includes( 'unit=week' ) ) {
				return new Promise( resolve => {
					resolveWeek = resolve;
				} );
			}
			return Promise.resolve( { ...subscribersResponse, unit: 'day' } );
		} );

		renderStats();

		await expect( screen.findByTestId( 'subscriber-chart' ) ).resolves.toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Weeks' } ) );

		expect( screen.getByText( '200' ) ).toBeInTheDocument();
		expect( screen.getByText( '15' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Loading subscriber stats…' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'subscriber-chart-panel' ) ).toHaveAttribute( 'aria-busy', 'true' );
		expect( mockLineChart ).toHaveBeenCalledWith(
			expect.objectContaining( {
				options: expect.objectContaining( {
					axis: expect.objectContaining( {
						x: { tickResolution: 'day' },
					} ),
				} ),
			} )
		);

		resolveWeek( {
			unit: 'week',
			fields: [ 'period', 'subscribers', 'subscribers_paid' ],
			data: [ [ '2026W09W14', 40, 2 ] ],
		} );

		await waitFor( () => {
			expect( mockLineChart ).toHaveBeenCalledWith(
				expect.objectContaining( {
					options: expect.objectContaining( {
						axis: expect.objectContaining( {
							x: { tickResolution: 'week' },
						} ),
					} ),
					data: expect.arrayContaining( [
						expect.objectContaining( {
							data: [ { dateString: '2026-09-14', value: 40 } ],
						} ),
					] ),
				} )
			);
		} );
		expect( screen.getByText( '200' ) ).toBeInTheDocument();
		expect( screen.getByText( '15' ) ).toBeInTheDocument();
		expect( screen.queryByText( '40' ) ).not.toBeInTheDocument();
	} );

	it( 'pages the chart end date one window at a time', async () => {
		renderStats();

		await expect(
			screen.findByRole( 'button', { name: 'Previous period' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Next period' } ) ).toBeDisabled();

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Previous period' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_stats_period_click', {
			site_type: 'jetpack',
			direction: 'previous',
			interval: 'day',
		} );
		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( 'unit=day&quantity=30&date=2026-08-22' ),
			} );
		} );
		expect( screen.getByRole( 'button', { name: 'Next period' } ) ).toBeEnabled();

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Next period' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_stats_period_click', {
			site_type: 'jetpack',
			direction: 'next',
			interval: 'day',
		} );
		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( 'date=2026-09-21' ),
			} );
		} );
		expect( screen.getByText( '200' ) ).toBeInTheDocument();
		expect( screen.getByText( '15' ) ).toBeInTheDocument();
		expect(
			mockApiFetch.mock.calls.filter( ( [ { path } ] ) => path.includes( 'quantity=1&' ) )
		).toHaveLength( 1 );
	} );

	it( 'does not record a click when the selected interval is chosen again', async () => {
		renderStats();

		await expect( screen.findByRole( 'radio', { name: 'Days' } ) ).resolves.toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Days' } ) );

		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_newsletter_stats_interval_click',
			expect.anything()
		);
	} );

	it( 'ignores an interval button whose value is not a chart unit', async () => {
		renderStats();

		const weeks = await screen.findByRole( 'radio', { name: 'Weeks' } );
		weeks.setAttribute( 'value', 'fortnight' );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( weeks );

		expect( mockRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_newsletter_stats_interval_click',
			expect.anything()
		);
		expect( mockApiFetch ).not.toHaveBeenCalledWith( {
			path: expect.stringContaining( 'unit=fortnight' ),
		} );
	} );

	it( 'moves the chart window by weeks, months, and years', async () => {
		renderStats();

		await expect( screen.findByRole( 'radio', { name: 'Weeks' } ) ).resolves.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Weeks' } ) );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Previous period' } ) );
		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( 'unit=week&quantity=12&date=2026-06-29' ),
			} );
		} );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Next period' } ) );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Months' } ) );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Previous period' } ) );
		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( 'unit=month&quantity=6&date=2026-03-21' ),
			} );
		} );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Next period' } ) );

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Years' } ) );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Previous period' } ) );
		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: expect.stringContaining( 'unit=year&quantity=3&date=2023-09-21' ),
			} );
		} );
	} );

	it( 'shows the empty state when the subscribers response has no period column', async () => {
		mockStatsFetch( () => Promise.resolve( { fields: [ 'subscribers' ], data: [ [ 122 ] ] } ) );

		renderStats();

		await expect(
			screen.findByText( 'No subscriber data is available for this period.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'skips subscriber rows that are not dated', async () => {
		mockStatsFetch( () =>
			Promise.resolve( {
				fields: [ 'period', 'subscribers', 'subscribers_paid' ],
				data: [
					[ 10, 5, 1 ],
					[ '2026-09-10', 122, 8 ],
				],
			} )
		);

		renderStats();

		await expect( screen.findByTestId( 'subscriber-chart' ) ).resolves.toBeInTheDocument();
		expect( mockLineChart ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: [
					expect.objectContaining( {
						data: [ { dateString: '2026-09-10', value: 122 } ],
					} ),
					expect.objectContaining( {
						data: [ { dateString: '2026-09-10', value: 8 } ],
					} ),
				],
			} )
		);
	} );
} );
