// JETPACK-2297 — `sort_order` reaches the bridge, and the four consumers
// of `useActivityPageQuery` do not all follow the list into it.
//
// That last half is the whole point of this file. Three of the four
// consumers take the direction from the list's view state; two must stay
// pinned to newest-first no matter what the list is showing, because
// they ask "what is the newest backup?" and "does this site have any
// restore points?" — questions whose answers are read off the *first*
// row, which only means "newest" while the server is sorting descending.
//
// Nothing in the running dashboard would report getting this wrong. The
// default selection would silently become the oldest restore point the
// reader has, on the one control that starts a destructive operation,
// and the first-run takeover would appear on a site full of backups. So
// the inversion is asserted directly here rather than left to a
// screen-level test to notice.

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

// Two pages of the same three backups, in the two orders the server can
// return them. The rewind ids deliberately differ at position 0: a
// consumer that follows the list into ascending order reads NEWEST_ID
// where it should read OLDEST_ID, and vice versa, so every assertion
// below fails loudly rather than coincidentally passing.
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

		// Ordering is the server's job: these are the rows as served, not a
		// client-side re-sort of a descending page.
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
		// Two distinct requests, because the direction is part of the cache
		// key. Only one page of a multi-page log is ever in hand, so a
		// client-side flip would reverse ten rows and call it a sort.
		expect( requestedPaths() ).toHaveLength( 2 );
		expect( requestedPaths()[ 1 ] ).toContain( 'sort_order=asc' );
	} );
} );

describe( 'the newest-backup consumers', () => {
	it( 'still finds the newest backup while the list is sorted ascending', async () => {
		// The single most important assertion in this change. Both hooks
		// read the first backup row of page 1; if either inherited the
		// list's ascending order it would read OLDEST_ID here and nothing
		// in the dashboard would say so.
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

		// Proof the pinning is real rather than the mock returning one body:
		// two requests went out, in opposite directions.
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
		// `useHasRestorePoints` gates the first-run takeover panel. Reading
		// whichever page the list happens to be on would let page 2 of an
		// ascending list answer "nothing here" and replace the dashboard.
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
		// One ascending request between the two of them. Pinning this hook
		// to `desc` would have fetched the same rows a second time.
		expect( requestedPaths() ).toEqual( [ expect.stringContaining( 'sort_order=asc' ) ] );
	} );
} );
