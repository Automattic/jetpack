/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	REFRESH_NOTICE_META,
	queryClient,
} from '@jetpack-premium-analytics/data';
import { useQuery } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { RefreshFailureNotice } from './refresh-failure-notice';

/**
 * Stands in for a widget: a query on the shared client the notice reads, so the
 * assertions run against real query transitions rather than a stubbed hook.
 *
 * @param props         - Component props.
 * @param props.queryFn - Fetcher for the query.
 * @return What the widget has to show: its view count, or why it has none.
 */
function Widget( { queryFn }: { queryFn: () => Promise< unknown > } ) {
	const { data, isError } = useQuery( {
		queryKey: [ 'refresh-failure-notice-probe' ],
		queryFn: queryFn as () => Promise< { views: number } >,
		retry: false,
		meta: REFRESH_NOTICE_META,
	} );

	return <span>{ data ? String( data.views ) : ( isError && 'failed' ) || 'loading' }</span>;
}

/**
 * The same probe without the opt-in `meta`, standing in for the supporting
 * queries that share the cache but hold none of the numbers on screen.
 *
 * @param props         - Component props.
 * @param props.queryFn - Fetcher for the query.
 * @return The fetched value, or why there is none.
 */
function UnscopedWidget( { queryFn }: { queryFn: () => Promise< unknown > } ) {
	const { data, isError } = useQuery( {
		queryKey: [ 'refresh-failure-notice-unscoped' ],
		queryFn: queryFn as () => Promise< { views: number } >,
		retry: false,
	} );

	return <span>{ data ? String( data.views ) : ( isError && 'failed' ) || 'loading' }</span>;
}

/**
 * Renders the notice the way the stage does: above a widget, sharing its client.
 *
 * @param queryFn - Fetcher for the widget's query.
 */
function renderDashboard( queryFn: () => Promise< unknown > ) {
	render(
		<AnalyticsQueryClientProvider>
			<Widget queryFn={ queryFn } />
			<RefreshFailureNotice className="refresh-failure" />
		</AnalyticsQueryClientProvider>
	);
}

/**
 * Refetches every mounted query, which is what a date change or a poll does.
 */
async function refetch() {
	await act( async () => {
		await queryClient.refetchQueries();
	} );
}

/**
 * The notice's copy is mirrored into the `speak()` live region, so this names
 * the description element rather than matching both.
 *
 * @param text - Pattern to match against the description.
 * @return The description element, or null.
 */
function description( text: RegExp ) {
	return screen.queryByText( text, { selector: 'span' } );
}

describe( 'RefreshFailureNotice', () => {
	// The client is module-level and outlives tests; clear it before RTL's cleanup
	// unmounts the notice, so this actually re-renders it.
	afterEach( () => act( () => queryClient.clear() ) );

	it( 'stays out of the way while the widgets have what they asked for', async () => {
		renderDashboard( () => Promise.resolve( { views: 1 } ) );

		await expect( screen.findByText( '1' ) ).resolves.toBeInTheDocument();
		expect( description( /Couldn't refresh\./ ) ).not.toBeInTheDocument();
	} );

	it( 'stays quiet when a first load fails, which the widget reports itself', async () => {
		renderDashboard( () => Promise.reject( { status: 500 } ) );

		await expect( screen.findByText( 'failed' ) ).resolves.toBeInTheDocument();
		expect( description( /Couldn't refresh\./ ) ).not.toBeInTheDocument();
	} );

	it( 'names the numbers as stale once a refresh fails, and retries them', async () => {
		const queryFn = jest
			.fn< Promise< unknown >, [] >()
			.mockResolvedValueOnce( { views: 1 } )
			.mockRejectedValueOnce( { status: 500 } )
			.mockResolvedValue( { views: 2 } );
		renderDashboard( queryFn );

		await expect( screen.findByText( '1' ) ).resolves.toBeInTheDocument();
		await refetch();

		// The widget keeps showing what it fetched; only the notice says it is old.
		expect( screen.getByText( '1' ) ).toBeInTheDocument();
		expect( description( /Couldn't refresh\. Showing data from / ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		await expect( screen.findByText( '2' ) ).resolves.toBeInTheDocument();
		expect( description( /Couldn't refresh\./ ) ).not.toBeInTheDocument();
	} );

	it( 'stays quiet when the failure is not one the reader reads numbers from', async () => {
		const queryFn = jest
			.fn< Promise< unknown >, [] >()
			.mockResolvedValueOnce( { views: 1 } )
			.mockRejectedValue( { status: 500 } );

		render(
			<AnalyticsQueryClientProvider>
				{ /* No `meta`: a thumbnail or a settings read, not a figure on screen. */ }
				<UnscopedWidget queryFn={ queryFn } />
				<RefreshFailureNotice className="refresh-failure" />
			</AnalyticsQueryClientProvider>
		);

		await expect( screen.findByText( '1' ) ).resolves.toBeInTheDocument();
		await refetch();

		expect( screen.getByText( '1' ) ).toBeInTheDocument();
		expect( description( /Couldn't refresh\./ ) ).not.toBeInTheDocument();
	} );

	it( 'drops the retry where retrying cannot help', async () => {
		const queryFn = jest
			.fn< Promise< unknown >, [] >()
			.mockResolvedValueOnce( { views: 1 } )
			.mockRejectedValue( { status: 403 } );
		renderDashboard( queryFn );

		await expect( screen.findByText( '1' ) ).resolves.toBeInTheDocument();
		await refetch();

		expect( description( /Couldn't refresh\. Showing data from / ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
