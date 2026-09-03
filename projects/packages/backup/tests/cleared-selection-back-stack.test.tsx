// JETPACK-2312: a selection restored from memory carried no `?selected=`, so clearing it was a
// no-op navigate TanStack pushed no history entry for — Back left the Overview instead of
// undoing the clear. Driven over a real `@tanstack/react-router` memory history, not the
// `@wordpress/route` mock the sibling suites use, since a mock has no history to miss an entry on.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
} from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { stage as DownloadStage } from '../routes/download/stage';
import { queryClient } from '../src/dashboard/data/query-client';
import { resetListStateForTesting } from '../src/dashboard/screens/overview';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SETTLE = { timeout: 10000 };
const PER_PAGE = 10;
const CLEAR = 'Clear selection';

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

/**
 * A rewind id, newest first.
 *
 * @param index - 0-based position in the log.
 * @return The row's rewind id.
 */
function rewindId( index: number ): string {
	return `${ 1786644531 - index * 100 }.100`;
}

/**
 * The row's accessible name, which is also its heading in the detail pane.
 *
 * @param id - The row's rewind id.
 * @return The row title.
 */
function title( id: string ): string {
	return `Backup ${ id }`;
}

/** The log the fixture answers from, newest first. Grown mid-test to move a row to page 2. */
let log: string[] = [];

/**
 * One page of the log, in WPCOM's rewindable-activity shape.
 *
 * @param page - 1-indexed page number.
 * @return The response envelope.
 */
function activityPage( page: number ) {
	const start = ( page - 1 ) * PER_PAGE;
	return {
		current: {
			orderedItems: log.slice( start, start + PER_PAGE ).map( id => ( {
				activity_id: `act-${ id }`,
				name: 'rewind__backup_complete_full',
				gridicon: 'cloud',
				rewind_id: id,
				published: '2026-08-20T10:00:00+00:00',
				summary: title( id ),
				actor: { type: 'Application', name: 'Jetpack' },
				content: { text: '10 plugins, 4 themes' },
			} ) ),
		},
		totalItems: log.length,
		totalPages: Math.max( 1, Math.ceil( log.length / PER_PAGE ) ),
	};
}

/** Point every route the two screens read at a fixed set of answers. */
function mockEndpoints() {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			const args = new URLSearchParams( path.split( '?' )[ 1 ] ?? '' );
			return Promise.resolve( activityPage( Number( args.get( 'page' ) ?? 1 ) ) );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path.includes( '/rewind/backup/ls' ) ) {
			return Promise.resolve( { contents: {} } );
		}
		if ( path === '/jetpack/v4/backups' || path === '/jetpack/v4/restores' ) {
			return Promise.resolve( [] );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * Mount the Overview and Download routes under a router with its own memory history, the
 * same primitives `@wordpress/route` re-exports for production use.
 *
 * @return The router, cast down to the bits this suite reads.
 */
function renderApp() {
	const rootRoute = createRootRoute( { component: Outlet } );
	const router = createRouter( {
		routeTree: rootRoute.addChildren( [
			createRoute( { getParentRoute: () => rootRoute, path: '/', component: OverviewStage } ),
			createRoute( {
				getParentRoute: () => rootRoute,
				path: '/download/$rewindId',
				component: DownloadStage,
			} ),
		] ),
		history: createMemoryHistory( { initialEntries: [ '/' ] } ),
		// TanStack's options type wants a registered route tree, which nothing here declares.
	} as never );
	render( <RouterProvider router={ router as never } /> );
	return router as unknown as {
		history: { back: () => void };
		state: { location: { search: Record< string, unknown > } };
	};
}

/**
 * Choose the last row on page 1, leave for Download, then follow its back link home.
 *
 * The back link carries no search, which is what leaves the selection with no address —
 * see `screens/download.tsx`'s `<Link to="/">`.
 *
 * @param view - The app's router (a `renderApp` result), to read the address back off.
 * @return The chosen row's rewind id.
 */
async function roundTripViaDownload( view: ReturnType< typeof renderApp > ): Promise< string > {
	const chosen = rewindId( PER_PAGE - 1 );
	await userEvent.click( await screen.findByRole( 'button', { name: title( chosen ) }, SETTLE ) );
	await waitFor( () => expect( view.state.location.search ).toEqual( { selected: chosen } ) );

	await userEvent.click( await screen.findByRole( 'link', { name: /Download backup/ }, SETTLE ) );
	const back = await screen.findByRole( 'link', { name: /Back to overview/ }, SETTLE );

	// One new row lands while they are away — a completed restore writes one, and so does a
	// finished backup via `useRefreshActivityOnBackupComplete` — pushing their row onto page 2.
	log.unshift( rewindId( -1 ) );

	await userEvent.click( back );
	return chosen;
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	resetListStateForTesting();

	log = Array.from( { length: PER_PAGE }, ( _, index ) => rewindId( index ) );
	mockApiFetch.mockReset();
	mockEndpoints();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'Coming back from Download with a row chosen', () => {
	it( 'writes the remembered row into the address without a Back step of its own', async () => {
		const view = renderApp();
		const chosen = await roundTripViaDownload( view );

		// The write-back has to land, and land as `replace`: a `push` would cost an
		// extra Back step landing on the bare address this fires from.
		await waitFor( () => expect( view.state.location.search ).toEqual( { selected: chosen } ) );

		await act( async () => {
			view.history.back();
		} );

		// One Back from the restored address lands on Download — where the trip out
		// to Download itself came from — not on an extra step this write invented.
		await expect(
			screen.findByRole( 'heading', { name: 'Download backup' }, SETTLE )
		).resolves.toBeInTheDocument();
	} );

	it( 'lets Back undo clearing a selection that came from memory', async () => {
		const view = renderApp();
		const chosen = await roundTripViaDownload( view );

		// The row is on page 2 now and the list is still on page 1, so the pane
		// cannot resolve it and hedges instead of claiming it is gone.
		await userEvent.click( await screen.findByRole( 'button', { name: CLEAR }, SETTLE ) );
		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: CLEAR } ) ).not.toBeInTheDocument()
		);

		await act( async () => {
			view.history.back();
		} );

		// The copy admits the row may still be fine, so the discard has to be
		// undoable — landing back on the Overview with the selection restored,
		// not on the Download screen the return trip came from.
		await expect(
			screen.findByRole( 'button', { name: CLEAR }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( view.state.location.search ).toEqual( { selected: chosen } );
	} );
} );

describe( 'A selection nobody chose', () => {
	// The default row is the newest backup, which moves as backups land. Writing it to the
	// address would pin the row it happened to name past its own reason for being shown.
	it( 'never reaches the address, not even across the round trip', async () => {
		const view = renderApp();

		// The default renders, so a bare address below is not a pane that never resolved
		// anything — it is genuinely nothing having been chosen.
		await expect(
			screen.findByRole( 'heading', { name: title( rewindId( 0 ) ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( view.state.location.search ).toEqual( {} );

		await userEvent.click( await screen.findByRole( 'link', { name: /Download backup/ }, SETTLE ) );
		await userEvent.click(
			await screen.findByRole( 'link', { name: /Back to overview/ }, SETTLE )
		);

		await expect(
			screen.findByRole( 'heading', { name: title( rewindId( 0 ) ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( view.state.location.search ).toEqual( {} );
	} );
} );
