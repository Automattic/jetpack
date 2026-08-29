// JETPACK-2297 + JETPACK-2298 — the activity list's cog and funnel, as a
// reader finds them on first open.
//
// Everything here is asserted *before* any interaction with the sort
// controls, because that is where all three bugs lived:
//
//   - the funnel offered filters nothing could honour, and opening one
//     dropped the whole dashboard to its error boundary;
//   - "Sort by" displayed "Title" over date-ordered rows, because an
//     unset `view.sort` leaves a native <select> showing its first
//     option;
//   - items-per-page was disabled until something set `view.sort.field`,
//     so a reader who never opened Order was stuck at ten rows.
//
// The last one is the reason this file drives the real DataViews rather
// than asserting on `INITIAL_VIEW` directly: `disabled={ ! view.sort
// .field }` is dataviews' own wiring, and only a render proves the seed
// reaches it.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ActivityList from '../src/dashboard/components/activity-list';
import { INITIAL_VIEW } from '../src/dashboard/screens/overview';
import type { View } from '@wordpress/dataviews';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

/**
 * One rewindable-activity page, newest first.
 */
const PAGE = {
	current: {
		orderedItems: [
			{
				activity_id: 'a1',
				name: 'rewind__backup_complete_full',
				gridicon: 'cloud',
				rewind_id: '1786600000',
				published: '2026-08-20T10:00:00+00:00',
				summary: 'Backup complete',
				is_rewindable: true,
			},
		],
	},
	totalItems: 40,
	totalPages: 4,
};

/**
 * Every rewindable-activity path requested so far.
 *
 * @return The requested paths.
 */
function requestedPaths(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => ( options as { path?: string } )?.path ?? '' )
		.filter( path => path.includes( '/site/rewindable-activity' ) );
}

/**
 * No-op selection handler. Hoisted so the harness does not hand
 * `<ActivityList>` a fresh function on every render.
 */
function noop() {}

/**
 * Render the list with its real starting view, in controlled state so
 * the cog's own controls drive it exactly as they do on the screen.
 *
 * @return The rendered list.
 */
function ListHarness() {
	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	return (
		<ActivityList selectedId={ null } onSelect={ noop } view={ view } onChangeView={ setView } />
	);
}

/**
 * Render the harness and open the cog.
 */
async function renderAndOpenViewOptions() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	render(
		<QueryClientProvider client={ client }>
			<ListHarness />
		</QueryClientProvider>
	);
	await waitFor( () => expect( requestedPaths().length ).toBeGreaterThan( 0 ) );
	await userEvent.click( screen.getByRole( 'button', { name: 'View options' } ) );
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( PAGE );
	window.JP_CONNECTION_INITIAL_STATE = {
		connectionStatus: CONNECTED,
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'the filter affordance', () => {
	it( 'is not on screen at all', async () => {
		const client = new QueryClient( {
			defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
		} );
		render(
			<QueryClientProvider client={ client }>
				<ListHarness />
			</QueryClientProvider>
		);
		await waitFor( () => expect( requestedPaths().length ).toBeGreaterThan( 0 ) );

		// `filterBy: false` on every field leaves DataViews no filters to
		// offer, so `FiltersToggle` renders nothing — which is what puts the
		// `ValidatedText` crash out of reach, and stops a filter click
		// resetting a reader on page 3 back to page 1.
		expect( screen.queryByRole( 'button', { name: /add filter/i } ) ).not.toBeInTheDocument();

		// The witness. Without it this assertion would pass just as well
		// against a list that failed to render any chrome at all — which is
		// how a "renders nothing" test keeps passing for the wrong reason.
		expect( screen.getByRole( 'button', { name: 'View options' } ) ).toBeVisible();
	} );
} );

describe( 'the cog, before anyone touches it', () => {
	it( 'names the ordering the rows are actually in', async () => {
		await renderAndOpenViewOptions();

		const sortBy = screen.getByLabelText( 'Sort by' ) as HTMLSelectElement;
		// `description` is the "When" column — the event timestamp, which is
		// what WordPress.com orders on. The bug was this reading "Title".
		expect( sortBy.value ).toBe( 'description' );
		expect( sortBy.selectedOptions[ 0 ] ).toHaveTextContent( 'When' );
	} );

	it( 'does not offer a sort field the server cannot honour', async () => {
		await renderAndOpenViewOptions();

		// `/activity/rewindable` takes a direction and no field, so "When"
		// is the only truthful option. Title is `enableSorting: false`.
		const options = Array.from(
			( screen.getByLabelText( 'Sort by' ) as HTMLSelectElement ).options
		).map( option => option.textContent );
		expect( options ).toEqual( [ 'When' ] );
	} );

	it( 'lets a reader change the page size without touching Order first', async () => {
		// JETPACK-2298. dataviews disables the whole items-per-page group
		// while `view.sort.field` is unset; seeding `INITIAL_VIEW.sort` is
		// what unblocks it. Asserted through the rendered control because
		// that gating is dataviews' wiring, not ours.
		await renderAndOpenViewOptions();

		const twenty = screen.getByRole( 'radio', { name: '20' } );
		expect( twenty ).toBeEnabled();
		expect( twenty ).not.toHaveAttribute( 'aria-disabled', 'true' );

		await userEvent.click( twenty );

		await waitFor( () =>
			expect( requestedPaths().some( path => path.includes( 'number=20' ) ) ).toBe( true )
		);
	} );
} );

describe( 'the Order control', () => {
	it( 'reorders the whole log server-side rather than the rows on screen', async () => {
		await renderAndOpenViewOptions();

		expect( requestedPaths()[ 0 ] ).toContain( 'sort_order=desc' );

		await userEvent.click( screen.getByRole( 'radio', { name: /ascending/i } ) );

		// The list holds one page of forty items, so flipping it locally
		// would reorder ten rows and mislabel that a sort. A new request is
		// the only correct answer.
		await waitFor( () =>
			expect( requestedPaths().some( path => path.includes( 'sort_order=asc' ) ) ).toBe( true )
		);
	} );
} );
