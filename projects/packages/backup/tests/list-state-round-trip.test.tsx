// JETPACK-2312: going into Download or Restore and coming back put the reader on page 1
// with the newest backup selected, whatever they had been looking at. Every negative is
// paired with the row that proves the list rendered, and the last test is the control.

const mockApiFetch = jest.fn();
const mockSearch = jest.fn< Record< string, unknown >, [] >();
const mockNavigate = jest.fn();
const mockParams = jest.fn< Record< string, string >, [] >();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
	useNavigate: () => mockNavigate,
	useParams: () => mockParams(),
	// `search` is folded into the href rather than spread onto the node, so this
	// suite can read back exactly what a back link would carry.
	Link: ( {
		children,
		to,
		search,
		...rest
	}: {
		children: React.ReactNode;
		to: string;
		search?: Record< string, string >;
	} ) => (
		<a href={ search ? `${ to }?${ new URLSearchParams( search ).toString() }` : to } { ...rest }>
			{ children }
		</a>
	),
} ) );

// Imports must come after the jest.mock factories above.
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { stage as DownloadStage } from '../routes/download/stage';
import { stage as RestoreStage } from '../routes/restore/stage';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import { resetListStateForTesting } from '../src/dashboard/screens/overview';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SETTLE = { timeout: 10000 };
const NOT_FOUND = 'That item is no longer in the activity log.';

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

/** Flipped per test, so the gate verdict can be made to change under a mounted screen. */
let hasBackupPlan = true;

/** What the address bar holds, driven by the screens themselves rather than hand-fed. */
let routerSearch: Record< string, unknown > = {};

/**
 * The rewind id of the single backup on a given page at a given page size.
 *
 * @param page   - 1-indexed page number.
 * @param number - Page size.
 * @return The row's rewind id.
 */
function rewindId( page: number, number: number ): string {
	return String( 1786600000 + page * 100 + number );
}

/**
 * The row's accessible name, which is also its title in the detail pane.
 *
 * @param page   - 1-indexed page number.
 * @param number - Page size.
 * @return The row title.
 */
function rowTitle( page: number, number: number ): string {
	return `Backup page ${ page } of ${ number }`;
}

/**
 * One rewindable-activity page, in WPCOM's shape.
 *
 * One row per page, so the row's own name says which page and page size produced it.
 *
 * @param page   - 1-indexed page number.
 * @param number - Page size.
 * @return The response envelope.
 */
function activityPage( page: number, number: number ) {
	return {
		current: {
			orderedItems: [
				{
					activity_id: `act-p${ page }-n${ number }`,
					name: 'rewind__backup_complete_full',
					gridicon: 'cloud',
					rewind_id: rewindId( page, number ),
					published: '2026-08-20T10:00:00+00:00',
					summary: rowTitle( page, number ),
					actor: { type: 'Application', name: 'Jetpack' },
					content: { text: '10 plugins, 4 themes' },
				},
			],
		},
		totalItems: 60,
		totalPages: Math.ceil( 60 / number ),
	};
}

/**
 * The list row for a page, which carries `aria-pressed` for its selected state.
 *
 * @param page   - 1-indexed page number.
 * @param number - Page size.
 * @return The row button.
 */
function row( page: number, number: number ): HTMLElement {
	return screen.getByRole( 'button', { name: rowTitle( page, number ) } );
}

/**
 * Render the Overview and wait for the list to have rows.
 *
 * @param page   - The page expected on screen.
 * @param number - The page size expected on screen.
 * @return The render result.
 */
async function openOverview( page: number, number: number ) {
	const view = render( <OverviewStage /> );
	await expect(
		screen.findByRole( 'button', { name: rowTitle( page, number ) }, SETTLE )
	).resolves.toBeInTheDocument();
	return view;
}

/**
 * A log retention pruned to one page: an out-of-range page answers empty, as
 * WordPress.com does — otherwise the unclamped page still finds a row and the
 * assertion is vacuous.
 *
 * @param options            - Fixture options.
 * @param options.withTotals - Whether the envelope carries `totalItems` / `totalPages`.
 * @return An activity answer for `mockEndpoints`.
 */
function prunedToOnePage( { withTotals }: { withTotals: boolean } ) {
	return ( page: number, number: number ) => ( {
		current: { orderedItems: page > 1 ? [] : activityPage( 1, number ).current.orderedItems },
		...( withTotals ? { totalItems: 8, totalPages: 1 } : {} ),
	} );
}

/**
 * Point every route the Overview reads at a fixed set of answers.
 *
 * @param options          - Fixture options.
 * @param options.activity - What the log answers for a page request. Defaults to a 60-row log.
 */
function mockEndpoints( {
	activity = activityPage,
}: { activity?: ( page: number, number: number ) => object } = {} ) {
	mockApiFetch.mockImplementation( ( options: { path?: string } ) => {
		const path = options?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			const args = new URLSearchParams( path.split( '?' )[ 1 ] ?? '' );
			return Promise.resolve(
				activity( Number( args.get( 'page' ) ?? 1 ), Number( args.get( 'number' ) ?? 10 ) )
			);
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path === '/jetpack/v4/backups' || path === '/jetpack/v4/restores' ) {
			return Promise.resolve( [] );
		}
		return Promise.resolve( {} );
	} );
}

/**
 * Leave the Overview for another route and follow that route's back link home.
 *
 * The unmount is the navigation, as in `tracks-events.test.tsx` — the three routes share
 * one admin page — and the search to come back with is read off the rendered link.
 *
 * @param Stage - The route stage to visit.
 */
async function roundTripVia( Stage: () => React.JSX.Element ): Promise< void > {
	const view = render( <Stage /> );
	const back = await screen.findByRole( 'link', { name: /Back to overview/ }, SETTLE );
	const [ , query = '' ] = ( back.getAttribute( 'href' ) ?? '' ).split( '?' );
	routerSearch = Object.fromEntries( new URLSearchParams( query ) );
	view.unmount();
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	resetListStateForTesting();

	hasBackupPlan = true;
	routerSearch = {};
	mockSearch.mockReset();
	mockSearch.mockImplementation( () => routerSearch );
	mockNavigate.mockReset();
	mockNavigate.mockImplementation(
		( options: {
			search?:
				| Record< string, unknown >
				| ( ( previous: Record< string, unknown > ) => Record< string, unknown > );
		} ) => {
			const next = options?.search;
			routerSearch = typeof next === 'function' ? next( routerSearch ) : next ?? {};
		}
	);
	mockParams.mockReset();
	mockParams.mockReturnValue( { rewindId: rewindId( 2, 10 ) } );

	mockApiFetch.mockReset();
	mockEndpoints();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'The trip out to Download and back', () => {
	it( 'returns the reader to the page and the row they left', async () => {
		const overview = await openOverview( 1, 10 );

		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowTitle( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();

		await userEvent.click( row( 2, 10 ) );
		// `setSelected` hands the router an updater, which the mock above applies —
		// so the address is what there is to assert.
		expect( routerSearch ).toEqual( { selected: rewindId( 2, 10 ) } );
		// Stands in for the router committing what `setSelected` asked for: `useSearch`
		// is a mock, so nothing else re-reads the address.
		overview.rerender( <OverviewStage /> );
		await waitFor( () => expect( row( 2, 10 ) ).toHaveAttribute( 'aria-pressed', 'true' ) );

		overview.unmount();
		await roundTripVia( DownloadStage );
		// The back link carries nothing, which is why the URL cannot be what restores this.
		expect( routerSearch ).toEqual( {} );

		render( <OverviewStage /> );

		// The detail pane resolves first — `useActivityById` scans every cached page —
		// so the list's own rows are the later of the two.
		await expect(
			screen.findByRole( 'heading', { name: rowTitle( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		await waitFor( () => expect( row( 2, 10 ) ).toHaveAttribute( 'aria-pressed', 'true' ) );
		expect( screen.queryByRole( 'button', { name: rowTitle( 1, 10 ) } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: rowTitle( 1, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'The trip out to Restore and back', () => {
	it( 'returns the reader to the page size they chose', async () => {
		const overview = await openOverview( 1, 10 );

		await userEvent.click( screen.getByRole( 'button', { name: 'View options' } ) );
		await userEvent.click( screen.getByRole( 'radio', { name: '20' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowTitle( 1, 20 ) }, SETTLE )
		).resolves.toBeInTheDocument();

		overview.unmount();
		await roundTripVia( RestoreStage );

		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: rowTitle( 1, 20 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: rowTitle( 1, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'A gate verdict that changes under the reader', () => {
	// `<Gates>` mounts the Overview's body, so a verdict change unmounts it on its own —
	// the same loss as a navigation, without one.
	it( 'leaves the reader on their page when the plan lapses and comes back', async () => {
		await openOverview( 1, 10 );

		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowTitle( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();

		hasBackupPlan = false;
		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: keys.capabilities() } );
		} );
		await expect(
			screen.findByText( "This site doesn't have an active Backup plan", {}, SETTLE )
		).resolves.toBeInTheDocument();

		hasBackupPlan = true;
		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: keys.capabilities() } );
		} );

		await expect(
			screen.findByRole( 'button', { name: rowTitle( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: rowTitle( 1, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'A fresh page load', () => {
	// The control for all three above: same fixtures, same round trip, only the memory
	// reset — without it a list stuck on page 2 would pass every assertion here.
	it( 'starts at the top of the list with the newest backup selected', async () => {
		const overview = await openOverview( 1, 10 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowTitle( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		overview.unmount();
		await roundTripVia( DownloadStage );

		// The reload: module state is what a new page load does not inherit.
		resetListStateForTesting();
		queryClient.clear();

		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: rowTitle( 1, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( row( 1, 10 ) ).toHaveAttribute( 'aria-pressed', 'true' );
		expect( screen.queryByRole( 'button', { name: rowTitle( 2, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'A remembered place that no longer exists', () => {
	// The remembered page is not clamped by DataViews, and its footer disappears
	// entirely at one page — so an unclamped reader has no pagination to escape with.
	it( 'lands on the last page that exists when the log shrank while they were away', async () => {
		const overview = await openOverview( 1, 10 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowTitle( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();

		overview.unmount();
		await roundTripVia( DownloadStage );

		// Retention pruned the log to a single page while they were on Download.
		mockEndpoints( { activity: prunedToOnePage( { withTotals: true } ) } );
		queryClient.clear();

		render( <OverviewStage /> );

		// The row is the positive: without the clamp the list asks for page 2 of a
		// one-page log and DataViews renders "No results" with no footer.
		await expect(
			screen.findByRole( 'button', { name: rowTitle( 1, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
	} );

	// Same dead end, reached by the response shape the clamp is written for: an
	// out-of-range page with no envelope totals. `totalItems` degrades to the rows
	// in hand — none — so a guard reading it vetoes the escape hatch here.
	it( 'lands there too when the log answers without the envelope totals', async () => {
		const overview = await openOverview( 1, 10 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowTitle( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();

		overview.unmount();
		await roundTripVia( DownloadStage );

		mockEndpoints( { activity: prunedToOnePage( { withTotals: false } ) } );
		queryClient.clear();

		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: rowTitle( 1, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Clearing a selection that came from memory', () => {
	// `clearSelected` navigates to the URL it is already on, which TanStack treats
	// as a no-op — so without state the pane never re-renders and the button is inert.
	it( 'renders the change, not just forgets it', async () => {
		// Page 2's row, so the remembered row differs from `defaultSelectedId` — which is
		// page 1's newest backup, and would otherwise mask the clear.
		const overview = await openOverview( 1, 10 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await userEvent.click( await screen.findByRole( 'button', { name: rowTitle( 2, 10 ) } ) );
		// As above: `useSearch` is a mock, so this stands in for the router commit.
		overview.rerender( <OverviewStage /> );
		await waitFor( () => expect( row( 2, 10 ) ).toHaveAttribute( 'aria-pressed', 'true' ) );

		overview.unmount();
		await roundTripVia( RestoreStage );

		// The remembered row is gone from the log by the time they return — the case
		// that reaches the dead end without a `?selected=` to clear.
		mockEndpoints( {
			activity: ( page, number ) => {
				const fresh = activityPage( page, number );
				fresh.current.orderedItems[ 0 ].rewind_id = `${ rewindId( page, number ) }5`;
				return fresh;
			},
		} );
		queryClient.clear();

		render( <OverviewStage /> );
		// The address carries nothing, so only the memory can be putting them here.
		expect( routerSearch.selected ).toBeUndefined();
		await expect( screen.findByText( NOT_FOUND, {}, SETTLE ) ).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Clear selection' } ) );

		// Without state behind the memory the navigate is a no-op, so the pane never
		// re-renders and the dead end stays on screen.
		await waitFor( () => expect( screen.queryByText( NOT_FOUND ) ).not.toBeInTheDocument() );
	} );
} );
