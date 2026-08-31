// JETPACK-2297 + JETPACK-2298 — the activity list's cog and funnel on first
// open, before any interaction, which is where all three bugs lived. Drives the
// real DataViews rather than `INITIAL_VIEW` alone because the items-per-page
// gating is dataviews' own wiring, and only a render proves the seed reaches it.

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
import { ACTIVITY_LOG_NEWEST_FIRST } from '../src/dashboard/hooks/use-activity-log';
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

		// `filterBy: false` on every field leaves DataViews nothing to offer, so
		// `FiltersToggle` renders nothing and the `ValidatedText` crash is
		// unreachable.
		expect( screen.queryByRole( 'button', { name: /add filter/i } ) ).not.toBeInTheDocument();

		// Witness: without it the assertion above passes against a list that
		// rendered no chrome at all.
		expect( screen.getByRole( 'button', { name: 'View options' } ) ).toBeVisible();
	} );
} );

describe( 'the cog, before anyone touches it', () => {
	// Two assertions: with only one sortable field left, a valueless <select>
	// reports `description` anyway, so the rendered control cannot witness the
	// seed and the two need pinning separately.
	it( 'names the ordering the rows are actually in', async () => {
		expect( INITIAL_VIEW.sort ).toEqual( {
			field: 'description',
			direction: ACTIVITY_LOG_NEWEST_FIRST,
		} );

		await renderAndOpenViewOptions();

		const sortBy = screen.getByLabelText( 'Sort by' ) as HTMLSelectElement;
		// `description` is the "When" column. The bug was this reading "Title".
		expect( sortBy.value ).toBe( 'description' );
		expect( sortBy.selectedOptions[ 0 ] ).toHaveTextContent( 'When' );
	} );

	it( 'does not offer a sort field the server cannot honour', async () => {
		await renderAndOpenViewOptions();

		// `/activity/rewindable` takes a direction and no field, so "When" is the
		// only truthful option.
		const options = Array.from(
			( screen.getByLabelText( 'Sort by' ) as HTMLSelectElement ).options
		).map( option => option.textContent );
		expect( options ).toEqual( [ 'When' ] );
	} );

	it( 'lets a reader change the page size without touching Order first', async () => {
		// JETPACK-2298: dataviews disables items-per-page while `view.sort.field`
		// is unset, so this has to go through the rendered control.
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
	it( 'sends the reader back to page 1 when the order flips', async () => {
		// DataViews will not do this itself: `SortDirectionControl` spreads
		// `...view` and replaces only `sort`, stranding a reader on page 3.
		await renderAndOpenViewOptions();

		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
		await waitFor( () =>
			expect( requestedPaths().some( path => path.includes( 'page=2' ) ) ).toBe( true )
		);

		await userEvent.click( screen.getByRole( 'radio', { name: /ascending/i } ) );

		await waitFor( () =>
			expect( requestedPaths().some( path => path.includes( 'sort_order=asc' ) ) ).toBe( true )
		);
		const ascending = requestedPaths().filter( path => path.includes( 'sort_order=asc' ) );
		expect( ascending ).toHaveLength( 1 );
		expect( ascending[ 0 ] ).toContain( 'page=1' );
		expect( ascending[ 0 ] ).not.toContain( 'page=2' );
	} );

	it( 'leaves the page alone when something other than the order changes', async () => {
		// The reset is scoped to a reorder. Paging must not reset itself to
		// page 1, which would make the Next button inert.
		await renderAndOpenViewOptions();

		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );

		await waitFor( () =>
			expect( requestedPaths().some( path => path.includes( 'page=2' ) ) ).toBe( true )
		);
	} );

	it( 'reorders the whole log server-side rather than the rows on screen', async () => {
		await renderAndOpenViewOptions();

		expect( requestedPaths()[ 0 ] ).toContain( 'sort_order=desc' );

		await userEvent.click( screen.getByRole( 'radio', { name: /ascending/i } ) );

		// The list holds one page of forty items, so a local flip would reorder ten
		// rows and call that a sort.
		await waitFor( () =>
			expect( requestedPaths().some( path => path.includes( 'sort_order=asc' ) ) ).toBe( true )
		);
	} );
} );
