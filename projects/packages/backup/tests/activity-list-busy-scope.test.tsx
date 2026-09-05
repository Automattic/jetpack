// JETPACK-2535 — DataViews puts `inert` on the composite that owns every row,
// so what the list reports as loading decides whether a reader keeps their place.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ActivityList from '../src/dashboard/components/activity-list';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import { INITIAL_VIEW } from '../src/dashboard/screens/overview';
import type { View } from '@wordpress/dataviews';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SETTLE = { timeout: 10000 };

const row = ( id: string ) => ( {
	activity_id: id,
	name: 'rewind__backup_complete_full',
	gridicon: 'cloud',
	rewind_id: id,
	published: '2026-08-20T10:00:00+00:00',
	summary: `Backup ${ id }`,
	is_rewindable: true,
} );

const PAGE = { current: { orderedItems: [ row( '1786600000' ) ] }, totalItems: 40, totalPages: 4 };

/**
 * Whether the rows' own container is inert. The footer carries its own.
 *
 * @return True while the rows are out of the accessibility tree.
 */
function rowsAreInert(): boolean {
	return !! document.querySelector( '.dataviews-view-list[inert], [role="grid"][inert]' );
}

/** No-op selection handler; these tests never act on a choice. */
function noop() {}

/**
 * Render the list in controlled state, so its own pagination drives the view.
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
 * Hold the next response open so an in-flight fetch can be observed.
 *
 * @return A function that releases the held response.
 */
function freezeNextFetch(): ( value: unknown ) => void {
	let release: ( value: unknown ) => void = () => {};
	mockApiFetch.mockImplementationOnce(
		() =>
			new Promise( resolve => {
				release = resolve;
			} )
	);
	return ( value: unknown ) => release( value );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( {
		queries: { ...queryClient.getDefaultOptions().queries, retry: false },
	} );
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( PAGE );
	window.JP_CONNECTION_INITIAL_STATE = {
		connectionStatus: CONNECTED,
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

it( 'keeps the rows reachable through a background refetch', async () => {
	render(
		<QueryClientProvider>
			<ListHarness />
		</QueryClientProvider>
	);
	await expect(
		screen.findByRole( 'button', { name: /^Backup 1786600000/ }, SETTLE )
	).resolves.toBeInTheDocument();

	// Mount fires two queries of its own, so only a rise from here proves
	// the invalidation's refetch is the one in flight below.
	const before = mockApiFetch.mock.calls.length;
	const release = freezeNextFetch();
	await act( async () => {
		queryClient.invalidateQueries( { queryKey: keys.activityLogRoot() } );
	} );
	await waitFor( () => expect( mockApiFetch.mock.calls.length ).toBeGreaterThan( before ) );

	// The refetch is in flight right now — this is the window that used to
	// blur a reader out of the list.
	expect( rowsAreInert() ).toBe( false );

	await act( async () => {
		release( PAGE );
	} );
} );

it( 'still reports the page change the reader asked for', async () => {
	render(
		<QueryClientProvider>
			<ListHarness />
		</QueryClientProvider>
	);
	await expect(
		screen.findByRole( 'button', { name: /^Backup 1786600000/ }, SETTLE )
	).resolves.toBeInTheDocument();

	const release = freezeNextFetch();
	await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );
	await waitFor( () => expect( rowsAreInert() ).toBe( true ) );

	await act( async () => {
		release( PAGE );
	} );
} );
