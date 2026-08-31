// JETPACK-2297 — `sort_order` reaches the bridge, and the two consumers that
// read "the first row" stay pinned to newest-first whatever the list shows.
// Nothing in the running dashboard reports getting that inversion wrong, so it
// is asserted here rather than left to a screen-level test.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import {
	ACTIVITY_LOG_DEFAULT_PER_PAGE,
	useActivityById,
	useActivityLog,
	useDefaultBackupRewindId,
	useHasRestorePoints,
} from '../use-activity-log';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

/**
 * One raw WPCOM rewindable-activity entry, shaped as a backup row.
 *
 * @param rewindId - The row's rewind id, which is also its selection id.
 * @param when     - ISO publication timestamp.
 * @return A raw entry.
 */
function backupEntry( rewindId: string, when: string ) {
	return {
		activity_id: `activity-${ rewindId }`,
		name: 'rewind__backup_complete_full',
		gridicon: 'cloud',
		rewind_id: rewindId,
		published: when,
		summary: 'Backup complete',
		is_rewindable: true,
	};
}

// The rewind ids differ at position 0 on purpose: a consumer that follows the
// list into ascending order reads the wrong end and fails loudly.
const NEWEST_ID = '1786600000';
const MIDDLE_ID = '1786500000';
const OLDEST_ID = '1786400000';

const DESCENDING = {
	current: {
		orderedItems: [
			backupEntry( NEWEST_ID, '2026-08-20T10:00:00+00:00' ),
			backupEntry( MIDDLE_ID, '2026-08-19T10:00:00+00:00' ),
			backupEntry( OLDEST_ID, '2026-08-18T10:00:00+00:00' ),
		],
	},
	totalItems: 3,
	totalPages: 1,
};

const ASCENDING = {
	current: {
		orderedItems: [
			backupEntry( OLDEST_ID, '2026-08-18T10:00:00+00:00' ),
			backupEntry( MIDDLE_ID, '2026-08-19T10:00:00+00:00' ),
			backupEntry( NEWEST_ID, '2026-08-20T10:00:00+00:00' ),
		],
	},
	totalItems: 3,
	totalPages: 1,
};

/**
 * Answer `/site/rewindable-activity` from the direction the caller asked
 * for, so a hook reading the wrong order gets visibly wrong rows rather
 * than the same rows twice.
 */
function mockBridge() {
	mockedApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( ! path.includes( '/site/rewindable-activity' ) ) {
			return Promise.resolve( {} );
		}
		return Promise.resolve( path.includes( 'sort_order=asc' ) ? ASCENDING : DESCENDING );
	} );
}

/**
 * Every request the bridge mock has been given, in order.
 *
 * @return The requested paths.
 */
function requestedPaths(): string[] {
	return mockedApiFetch.mock.calls
		.map( ( [ options ] ) => ( options as { path?: string } )?.path ?? '' )
		.filter( path => path.includes( '/site/rewindable-activity' ) );
}

/**
 * Wrap a hook in an isolated QueryClient.
 *
 * Isolated per test so one test's cached page cannot satisfy another's
 * query — the request counts below are load-bearing.
 *
 * @return A wrapper component.
 */
function wrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	return ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
}

beforeEach( () => {
	mockedApiFetch.mockReset();
	mockBridge();
	window.JP_CONNECTION_INITIAL_STATE = {
		connectionStatus: CONNECTED,
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'useActivityLog', () => {
	it( 'asks the bridge for the direction it was given, and shows those rows', async () => {
		const { result } = renderHook(
			() =>
				useActivityLog( {
					page: 1,
					pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE,
					sortOrder: 'asc',
				} ),
			{ wrapper: wrapper() }
		);

		await waitFor( () => expect( result.current.items ).toHaveLength( 3 ) );

		// The rows as served — there is no client-side re-sort.
		expect( requestedPaths()[ 0 ] ).toContain( 'sort_order=asc' );
		expect( result.current.items[ 0 ] ).toMatchObject( { rewindId: OLDEST_ID } );
	} );

	it( 'refetches rather than reordering what is already on screen', async () => {
		const { rerender, result } = renderHook(
			( { sortOrder }: { sortOrder: 'asc' | 'desc' } ) =>
				useActivityLog( { page: 1, pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE, sortOrder } ),
			{ wrapper: wrapper(), initialProps: { sortOrder: 'desc' as const } }
		);

		await waitFor( () =>
			expect( result.current.items[ 0 ] ).toMatchObject( { rewindId: NEWEST_ID } )
		);

		rerender( { sortOrder: 'asc' } );

		await waitFor( () =>
			expect( result.current.items[ 0 ] ).toMatchObject( { rewindId: OLDEST_ID } )
		);
		// Two requests: the direction is part of the cache key, and only one page
		// of a multi-page log is ever in hand.
		expect( requestedPaths() ).toHaveLength( 2 );
		expect( requestedPaths()[ 1 ] ).toContain( 'sort_order=asc' );
	} );
} );

describe( 'the newest-backup consumers', () => {
	it( 'still finds the newest backup while the list is sorted ascending', async () => {
		// Both hooks read the first backup row of page 1: inheriting the list's
		// ascending order would silently give them OLDEST_ID.
		const { result } = renderHook(
			() => ( {
				list: useActivityLog( {
					page: 1,
					pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE,
					sortOrder: 'asc',
				} ),
				defaultRewindId: useDefaultBackupRewindId(),
				restorePoints: useHasRestorePoints(),
			} ),
			{ wrapper: wrapper() }
		);

		await waitFor( () => expect( result.current.defaultRewindId ).not.toBeNull() );
		await waitFor( () => expect( result.current.list.items ).toHaveLength( 3 ) );

		// The list is showing oldest-first…
		expect( result.current.list.items[ 0 ] ).toMatchObject( { rewindId: OLDEST_ID } );
		// …and the default selection is still the newest backup.
		expect( result.current.defaultRewindId ).toBe( NEWEST_ID );
		expect( result.current.restorePoints.hasRestorePoints ).toBe( true );

		// Two requests in opposite directions — the pinning is real, not the mock
		// returning one body.
		const paths = requestedPaths();
		expect( paths ).toHaveLength( 2 );
		expect( paths.filter( p => p.includes( 'sort_order=asc' ) ) ).toHaveLength( 1 );
		expect( paths.filter( p => p.includes( 'sort_order=desc' ) ) ).toHaveLength( 1 );
	} );

	it( 'costs no extra request when the list is already newest-first', async () => {
		const { result } = renderHook(
			() => ( {
				list: useActivityLog( {
					page: 1,
					pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE,
					sortOrder: 'desc',
				} ),
				defaultRewindId: useDefaultBackupRewindId(),
				restorePoints: useHasRestorePoints(),
			} ),
			{ wrapper: wrapper() }
		);

		await waitFor( () => expect( result.current.defaultRewindId ).toBe( NEWEST_ID ) );

		// All three share one cache entry in the default case, which is what
		// keeps the pinning free.
		expect( requestedPaths() ).toHaveLength( 1 );
	} );

	it( 'does not report a site as having no restore points when the list pages away', async () => {
		// This gates the first-run takeover: read off the list's own page, page 2
		// of an ascending list would answer "nothing here" and replace the dashboard.
		mockedApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( 'page=2' ) ) {
				return Promise.resolve( { current: { orderedItems: [] }, totalItems: 3, totalPages: 2 } );
			}
			return Promise.resolve( path.includes( 'sort_order=asc' ) ? ASCENDING : DESCENDING );
		} );

		const { result } = renderHook(
			() => ( {
				list: useActivityLog( {
					page: 2,
					pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE,
					sortOrder: 'asc',
				} ),
				restorePoints: useHasRestorePoints(),
			} ),
			{ wrapper: wrapper() }
		);

		await waitFor( () => expect( result.current.restorePoints.isLoading ).toBe( false ) );
		await waitFor( () => expect( result.current.list.items ).toHaveLength( 0 ) );

		expect( result.current.restorePoints.hasRestorePoints ).toBe( true );
	} );
} );

describe( 'the default selection on an ascending list', () => {
	it( 'resolves the newest backup even though no visible row holds it', async () => {
		// The intended trade: an ascending list highlights no row, and the pane is
		// still right via the cross-page cache scan. Re-deriving the default from
		// the visible page would put the oldest restore point behind Restore.
		const { result } = renderHook(
			() => {
				const list = useActivityLog( {
					page: 1,
					pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE,
					sortOrder: 'asc',
				} );
				const defaultRewindId = useDefaultBackupRewindId();
				return {
					list,
					defaultRewindId,
					item: useActivityById( defaultRewindId, 1, ACTIVITY_LOG_DEFAULT_PER_PAGE, 'asc' ),
				};
			},
			{ wrapper: wrapper() }
		);

		await waitFor( () => expect( result.current.item ).not.toBeNull() );

		// The pane resolves the newest backup…
		expect( result.current.defaultRewindId ).toBe( NEWEST_ID );
		expect( result.current.item ).toMatchObject( { rewindId: NEWEST_ID } );
		// …and the list is showing rows that start from the other end.
		expect( result.current.list.items[ 0 ] ).toMatchObject( { rewindId: OLDEST_ID } );
	} );

	it( 'leaves the selection off-screen rather than moving it onto the page', async () => {
		// Page 2 ascending holds neither end's newest row, so re-deriving the
		// default from the visible page would have to change one of these.
		mockedApiFetch.mockImplementation( ( options: { path?: string } ) => {
			const path = options?.path ?? '';
			if ( path.includes( 'page=2' ) ) {
				return Promise.resolve( {
					current: { orderedItems: [ backupEntry( MIDDLE_ID, '2026-08-19T10:00:00+00:00' ) ] },
					totalItems: 3,
					totalPages: 2,
				} );
			}
			return Promise.resolve( path.includes( 'sort_order=asc' ) ? ASCENDING : DESCENDING );
		} );

		const { result } = renderHook(
			() => {
				const list = useActivityLog( {
					page: 2,
					pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE,
					sortOrder: 'asc',
				} );
				const defaultRewindId = useDefaultBackupRewindId();
				return {
					list,
					defaultRewindId,
					item: useActivityById( defaultRewindId, 2, ACTIVITY_LOG_DEFAULT_PER_PAGE, 'asc' ),
				};
			},
			{ wrapper: wrapper() }
		);

		await waitFor( () => expect( result.current.item ).not.toBeNull() );

		const visibleIds = result.current.list.items.map( item =>
			item.kind === 'backup' ? item.rewindId : item.id
		);
		expect( visibleIds ).not.toContain( NEWEST_ID );
		expect( result.current.item ).toMatchObject( { rewindId: NEWEST_ID } );
	} );
} );

describe( 'useActivityById', () => {
	it( 'shares the list page rather than opening a second query for it', async () => {
		const { result } = renderHook(
			() => ( {
				list: useActivityLog( {
					page: 1,
					pageSize: ACTIVITY_LOG_DEFAULT_PER_PAGE,
					sortOrder: 'asc',
				} ),
				item: useActivityById( MIDDLE_ID, 1, ACTIVITY_LOG_DEFAULT_PER_PAGE, 'asc' ),
			} ),
			{ wrapper: wrapper() }
		);

		await waitFor( () => expect( result.current.item ).not.toBeNull() );

		expect( result.current.item ).toMatchObject( { rewindId: MIDDLE_ID } );
		// One ascending request between them: pinning this hook would refetch.
		expect( requestedPaths() ).toEqual( [ expect.stringContaining( 'sort_order=asc' ) ] );
	} );
} );
