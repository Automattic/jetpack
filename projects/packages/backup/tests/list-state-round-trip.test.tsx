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
import { onlineManager } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { stage as DownloadStage } from '../routes/download/stage';
import { stage as RestoreStage } from '../routes/restore/stage';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import { resetListStateForTesting } from '../src/dashboard/screens/overview';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SETTLE = { timeout: 10000 };

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
 * The same row as a name matcher. A row's accessible name carries its
 * timestamp after the title, so an exact string never matches the button.
 *
 * @param page   - 1-indexed page number.
 * @param number - Page size.
 * @return The matcher.
 */
function rowNamed( page: number, number: number ): RegExp {
	return new RegExp( `^${ rowTitle( page, number ) } ` );
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
	return screen.getByRole( 'button', { name: rowNamed( page, number ) } );
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
		screen.findByRole( 'button', { name: rowNamed( page, number ) }, SETTLE )
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
 * The page and size of every rewindable-activity request made so far.
 *
 * The list's own query is the only one that moves: `useDefaultBackupRewindId` and
 * `useHasRestorePoints` pin page 1 at the default size, so a non-default size
 * tells the two apart.
 *
 * @return `page/size` strings, in call order.
 */
function activityRequests(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => String( ( options as { path?: string } )?.path ?? '' ) )
		.filter( path => path.includes( '/site/rewindable-activity' ) )
		.map( path => {
			const args = new URLSearchParams( path.split( '?' )[ 1 ] ?? '' );
			return `${ args.get( 'page' ) ?? '1' }/${ args.get( 'number' ) ?? '10' }`;
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

/**
 * Put the list on page 2 at 20 per page, then leave the Overview and come back.
 *
 * The size is deliberately not the default: it is what makes the list's own request
 * distinguishable from the pinned page-1 lookups every mount makes.
 *
 * @param Stage - The route stage to visit on the way out.
 */
async function roundTripFromPage2Of20( Stage: () => React.JSX.Element ): Promise< void > {
	const overview = await openOverview( 1, 10 );

	await userEvent.click( screen.getByRole( 'button', { name: 'View options' } ) );
	await userEvent.click( screen.getByRole( 'radio', { name: '20' } ) );
	await expect(
		screen.findByRole( 'button', { name: rowNamed( 1, 20 ) }, SETTLE )
	).resolves.toBeInTheDocument();
	await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
	await expect(
		screen.findByRole( 'button', { name: rowNamed( 2, 20 ) }, SETTLE )
	).resolves.toBeInTheDocument();

	overview.unmount();
	await roundTripVia( Stage );
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

afterEach( () => {
	onlineManager.setOnline( true );
} );

describe( 'The trip out to Download and back', () => {
	it( 'returns the reader to the page and the row they left', async () => {
		const overview = await openOverview( 1, 10 );

		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowNamed( 2, 10 ) }, SETTLE )
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
		expect( screen.queryByRole( 'button', { name: rowNamed( 1, 10 ) } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: rowTitle( 1, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'The trip out to Restore and back', () => {
	it( 'returns the reader to the page size they chose', async () => {
		const overview = await openOverview( 1, 10 );

		await userEvent.click( screen.getByRole( 'button', { name: 'View options' } ) );
		await userEvent.click( screen.getByRole( 'radio', { name: '20' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowNamed( 1, 20 ) }, SETTLE )
		).resolves.toBeInTheDocument();

		overview.unmount();
		await roundTripVia( RestoreStage );

		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: rowNamed( 1, 20 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: rowNamed( 1, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'A gate verdict that changes under the reader', () => {
	// `<Gates>` mounts the Overview's body, so a verdict change unmounts it on its own —
	// the same loss as a navigation, without one.
	it( 'leaves the reader on their page when the plan lapses and comes back', async () => {
		await openOverview( 1, 10 );

		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowNamed( 2, 10 ) }, SETTLE )
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
			screen.findByRole( 'button', { name: rowNamed( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: rowNamed( 1, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'A fresh page load', () => {
	// The control for all three above: same fixtures, same round trip, only the memory
	// reset — without it a list stuck on page 2 would pass every assertion here.
	it( 'starts at the top of the list with the newest backup selected', async () => {
		const overview = await openOverview( 1, 10 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowNamed( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		overview.unmount();
		await roundTripVia( DownloadStage );

		// The reload: module state is what a new page load does not inherit.
		resetListStateForTesting();
		queryClient.clear();

		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: rowNamed( 1, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( row( 1, 10 ) ).toHaveAttribute( 'aria-pressed', 'true' );
		expect( screen.queryByRole( 'button', { name: rowNamed( 2, 10 ) } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'A remembered place that no longer exists', () => {
	// The remembered page is not clamped by DataViews, and its footer disappears
	// entirely at one page — so an unclamped reader has no pagination to escape with.
	it( 'lands on the last page that exists when the log shrank while they were away', async () => {
		const overview = await openOverview( 1, 10 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowNamed( 2, 10 ) }, SETTLE )
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
			screen.findByRole( 'button', { name: rowNamed( 1, 10 ) }, SETTLE )
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
			screen.findByRole( 'button', { name: rowNamed( 2, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();

		overview.unmount();
		await roundTripVia( DownloadStage );

		mockEndpoints( { activity: prunedToOnePage( { withTotals: false } ) } );
		queryClient.clear();

		render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: rowNamed( 1, 10 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'No results' ) ).not.toBeInTheDocument();
	} );

	// `0 ?? fallback` is `0`, so a literal zero in the envelope outlives the fallback
	// that would otherwise floor it at 1 — and page 0 is not a page anyone can ask for.
	it( 'never asks for page 0 when the log reports no pages at all', async () => {
		await roundTripFromPage2Of20( DownloadStage );

		// Only the list's own page size answers zero. The pinned page-1 lookups keep
		// their rows, or the first-run takeover replaces the body before the list mounts.
		mockEndpoints( {
			activity: ( page, number ) =>
				number === 20
					? { current: { orderedItems: [] }, totalItems: 0, totalPages: 0 }
					: activityPage( page, number ),
		} );
		queryClient.clear();
		mockApiFetch.mockClear();

		const view = render( <OverviewStage /> );

		await expect( screen.findByText( 'No results', {}, SETTLE ) ).resolves.toBeInTheDocument();
		expect( activityRequests() ).not.toContain( '0/20' );

		view.unmount();
	} );
} );

describe( 'A remembered place the log cannot answer for', () => {
	// The clamp reads `totalPages`, which falls back to 1 when the envelope is
	// missing — and a failed request has no envelope either. Clamping there both
	// moves the reader off the page they asked for and overwrites the memory of it,
	// and the fresh page-1 query hides the list's own error report.
	it( 'reports the failure on the page they asked for, and still remembers it', async () => {
		await roundTripFromPage2Of20( DownloadStage );

		// The log is unreachable by the time they come back.
		let activityFails = true;
		mockEndpoints( {
			activity: ( page, number ) =>
				activityFails
					? Promise.reject( new Error( 'The activity log is unavailable.' ) )
					: activityPage( page, number ),
		} );
		queryClient.clear();
		mockApiFetch.mockClear();

		const view = render( <OverviewStage /> );

		// The reason, where DataViews would otherwise say "No results".
		await expect(
			screen.findByRole( 'button', { name: 'Try again' }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'The activity log is unavailable.' ) ).toBeInTheDocument();

		// Page 1 at this size is where a clamp would send them, and nothing asked for it.
		await waitFor( () => expect( activityRequests() ).toContain( '2/20' ) );
		expect( activityRequests() ).not.toContain( '1/20' );

		// The retry is the only way out with the footer hidden, and it proves the
		// memory survived: page 2 is what comes back.
		activityFails = false;
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		await expect(
			screen.findByRole( 'button', { name: rowNamed( 2, 20 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: rowNamed( 1, 20 ) } ) ).not.toBeInTheDocument();

		view.unmount();
	} );
} );

describe( 'A remembered place asked for with no connection', () => {
	// Offline, React Query parks the request rather than sending it: `fetchStatus`
	// is `paused`, so `isFetching` is false and no error is ever reported. Nothing
	// has answered, and `totalPages` still falls back to 1.
	it( 'waits for the connection instead of moving the reader', async () => {
		await roundTripFromPage2Of20( DownloadStage );

		// Only the entry the list needs is dropped. `<Gates>` spins offline without its
		// cached verdict, and `useHasRestorePoints` reads the pinned page-1 query — a
		// paused one reports no rows and hands the body to the first-run takeover.
		queryClient.removeQueries( { queryKey: keys.activityLogPage( 2, 20, 'desc' ) } );
		mockApiFetch.mockClear();
		onlineManager.setOnline( false );

		const view = render( <OverviewStage /> );

		// The premise: paused, not failing. Nothing is sent, so nothing is learned.
		await expect(
			screen.findByRole( 'group', { name: 'Backup activity' }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( activityRequests() ).toEqual( [] );

		onlineManager.setOnline( true );

		// Page 2 is what resumes, so nothing moved the reader while they were offline.
		await expect(
			screen.findByRole( 'button', { name: rowNamed( 2, 20 ) }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( activityRequests() ).not.toContain( '1/20' );

		view.unmount();
	} );
} );

describe( 'Clearing a selection that came from memory', () => {
	// The return trip now writes the remembered row into the address itself (see
	// `cleared-selection-back-stack.test.tsx` for why), so by the time this mounts the
	// clear this test drives is a real search change — this mock just needs telling.
	it( 'renders the change, not just forgets it', async () => {
		// Page 2's row, so the remembered row differs from `defaultSelectedId` — which is
		// page 1's newest backup, and would otherwise mask the clear.
		const overview = await openOverview( 1, 10 );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await userEvent.click( await screen.findByRole( 'button', { name: rowNamed( 2, 10 ) } ) );
		// As above: `useSearch` is a mock, so this stands in for the router commit.
		overview.rerender( <OverviewStage /> );
		await waitFor( () => expect( row( 2, 10 ) ).toHaveAttribute( 'aria-pressed', 'true' ) );

		overview.unmount();
		await roundTripVia( RestoreStage );

		// The remembered row is gone from the log by the time they return — the case
		// that reaches the dead end without a page to find it on.
		mockEndpoints( {
			activity: ( page, number ) => {
				const fresh = activityPage( page, number );
				fresh.current.orderedItems[ 0 ].rewind_id = `${ rewindId( page, number ) }5`;
				return fresh;
			},
		} );
		queryClient.clear();

		const view = render( <OverviewStage /> );
		await expect(
			screen.findByRole( 'button', { name: 'Clear selection' }, SETTLE )
		).resolves.toBeInTheDocument();
		// The write-back effect puts the remembered row in the address once `<Gates>`
		// admits the body — same trip the rest of this file waits out.
		expect( routerSearch.selected ).toBe( rewindId( 2, 10 ) );

		await userEvent.click( screen.getByRole( 'button', { name: 'Clear selection' } ) );
		// As above: this stands in for the router commit `clearSelected`'s navigate makes.
		view.rerender( <OverviewStage /> );

		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Clear selection' } ) ).not.toBeInTheDocument()
		);
	} );
} );
