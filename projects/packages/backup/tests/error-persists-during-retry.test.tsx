// Regression tests for JETPACK-2243: the reason for a failure must not
// disappear the moment the reader asks to try again.
//
// React Query v5 rewinds an errored query *that holds no data* back to
// `status: 'pending'` when it refetches — a retry is treated as a fresh
// first load. So mid-retry `error` is null and `isLoading` is true, and
// every `error ? <QueryError/> : …` branch in the dashboard unmounted on
// click. The activity list fell back to DataViews' own "No results",
// which is precisely the copy D3 (#51294) existed to remove; the file
// browser fell through to a tree it had failed to load.
//
// It also made `QueryError`'s `isRetrying` prop (#51336) unreachable in
// every one of its three call sites: the component was gone before it
// could render its busy state.
//
// The fix keeps the last error until the refetch settles, at the hook
// layer so all three surfaces inherit it.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => () => {},
	useParams: () => ( { rewindId: '1786644531.123' } ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import ActivityList from '../src/dashboard/components/activity-list';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import { queryClient } from '../src/dashboard/data/query-client';
import { useBackups } from '../src/dashboard/hooks/use-backups';
import { useStickyError } from '../src/dashboard/hooks/use-sticky-error';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import { INITIAL_VIEW } from '../src/dashboard/screens/overview';
import type { View } from '@wordpress/dataviews';

const noop = () => {};

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

/**
 * One raw rewindable-activity row, so a successful retry has something
 * to render.
 *
 * @return A raw activity entry.
 */
function activityEntry() {
	return {
		activity_id: 'act-1',
		gridicon: 'cloud',
		summary: 'Backup complete',
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: '1786644531.123',
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '46 plugins, 23 themes' },
		name: 'rewind__backup_complete_full',
	};
}

/**
 * A promise whose settlement the test controls, so a retry can be held
 * in flight while assertions run against the rendered output.
 *
 * @return The promise and its resolver.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	const promise = new Promise< T >( res => {
		resolve = res;
	} );
	return { promise, resolve };
}

/**
 * `ActivityList` with the controlled view state it expects.
 *
 * @return The rendered harness.
 */
function Harness() {
	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	return (
		<QueryClientProvider>
			<ActivityList selectedId={ null } onSelect={ noop } view={ view } onChangeView={ setView } />
		</QueryClientProvider>
	);
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'useStickyError', () => {
	it( 'reports the error the query is currently carrying', () => {
		const error = new Error( 'boom' );
		const { result } = renderHook( () => useStickyError( error, false ) );

		expect( result.current ).toBe( error );
	} );

	it( 'holds the last error while the retry is still in flight', () => {
		const error = new Error( 'boom' );
		const { result, rerender } = renderHook(
			( { error: e, isFetching }: { error: Error | null; isFetching: boolean } ) =>
				useStickyError( e, isFetching ),
			{ initialProps: { error: error as Error | null, isFetching: false } }
		);

		// React Query nulls the error and starts fetching in the same tick.
		rerender( { error: null, isFetching: true } );

		expect( result.current ).toBe( error );
	} );

	it( 'clears once the retry succeeds', () => {
		const error = new Error( 'boom' );
		const { result, rerender } = renderHook(
			( { error: e, isFetching }: { error: Error | null; isFetching: boolean } ) =>
				useStickyError( e, isFetching ),
			{ initialProps: { error: error as Error | null, isFetching: false } }
		);

		rerender( { error: null, isFetching: true } );
		rerender( { error: null, isFetching: false } );

		expect( result.current ).toBeNull();
	} );

	it( 'replaces the held error when the retry fails differently', () => {
		const first = new Error( 'boom' );
		const second = new Error( 'still boom' );
		const { result, rerender } = renderHook(
			( { error: e, isFetching }: { error: Error | null; isFetching: boolean } ) =>
				useStickyError( e, isFetching ),
			{ initialProps: { error: first as Error | null, isFetching: false } }
		);

		rerender( { error: null, isFetching: true } );
		rerender( { error: second, isFetching: false } );

		expect( result.current ).toBe( second );
	} );

	it( 'reports nothing during a first load that has not failed', () => {
		const { result } = renderHook( () => useStickyError( null, true ) );

		expect( result.current ).toBeNull();
	} );
} );

describe( 'activity list', () => {
	it( 'keeps the reason and shows the retry as busy while it runs', async () => {
		mockApiFetch.mockRejectedValue( {
			code: 'activity_log_fetch_failed',
			message: 'Service unavailable',
		} );

		render( <Harness /> );

		await expect(
			screen.findByText( "We couldn't load your site's activity." )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Service unavailable' ) ).toBeInTheDocument();

		const retry = deferred< unknown >();
		mockApiFetch.mockImplementation( () => retry.promise );
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		// The regression: this is where "No results" used to take over.
		expect( screen.getByText( 'Service unavailable' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
		// `isRetrying` finally reaches the button it was written for.
		// Asserted as `aria-disabled`: the design-system Button keeps a
		// disabled control focusable rather than using the native
		// attribute, so `toBeDisabled()` does not see it.
		expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		retry.resolve( {
			current: { orderedItems: [ activityEntry() ] },
			totalItems: 1,
			totalPages: 1,
		} );

		await expect( screen.findByText( 'Backup complete' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Service unavailable' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'file browser', () => {
	it( 'keeps the reason on screen while its retry runs', async () => {
		mockApiFetch.mockRejectedValue( {
			code: 'file_browser_fetch_failed',
			message: 'Backup host unreachable',
		} );

		render(
			<QueryClientProvider>
				<FileBrowser
					rewindId="1786644531.123"
					selection={ EMPTY_FILE_SELECTION }
					onSelectionChange={ noop }
				/>
			</QueryClientProvider>
		);

		await expect(
			screen.findByText( "We couldn't load this backup's files." )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Backup host unreachable' ) ).toBeInTheDocument();

		const retry = deferred< unknown >();
		mockApiFetch.mockImplementation( () => retry.promise );
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );

		// The regression: the early return stopped firing mid-retry and the
		// browser fell through to a tree it had failed to load.
		expect( screen.getByText( "We couldn't load this backup's files." ) ).toBeInTheDocument();
		expect( screen.getByText( 'Backup host unreachable' ) ).toBeInTheDocument();

		retry.resolve( { contents: [] } );
		await waitFor( () =>
			expect( screen.queryByText( 'Backup host unreachable' ) ).not.toBeInTheDocument()
		);
	} );
} );

describe( 'backups', () => {
	// Only the transport-rejection path is at risk here. The route's other
	// failure mode — a `null` body served as HTTP 200 — resolves, so the
	// query stays a success across a refetch and `state` is derived from
	// the retained `data` rather than from `error`.
	it( 'stays in the error state while its retry runs', async () => {
		mockApiFetch.mockRejectedValue( {
			code: 'backups_fetch_failed',
			message: 'Gateway timeout',
		} );

		const { result } = renderHook( () => useBackups(), { wrapper: QueryClientProvider } );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.error ).not.toBeNull();

		const retry = deferred< unknown >();
		mockApiFetch.mockImplementation( () => retry.promise );
		act( () => result.current.refetch() );

		// The regression: `state` flipped back to 'loading' and the
		// Overview's QueryError — the only control that can ask again —
		// unmounted with it.
		await waitFor( () => expect( result.current.isRefetching ).toBe( true ) );
		expect( result.current.state ).toBe( 'error' );
		expect( result.current.error ).not.toBeNull();

		await act( async () => {
			retry.resolve( [] );
		} );
		await waitFor( () => expect( result.current.error ).toBeNull() );
	} );
} );
