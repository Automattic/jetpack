// JETPACK-2496 — the rows are the entry point to Restore and Download, and
// WordPress.com gives most of them the same summary. Two rows one minute apart
// is the whole defect: identical names on the control that picks a restore point.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import ActivityList from '../src/dashboard/components/activity-list';
import { INITIAL_VIEW } from '../src/dashboard/screens/overview';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };
const SUMMARY = 'Backup and scan complete';

const row = ( id: string, published: string ) => ( {
	activity_id: id,
	name: 'rewind__backup_complete_full',
	gridicon: 'cloud',
	rewind_id: id,
	published,
	summary: SUMMARY,
	is_rewindable: true,
} );

const PAGE = {
	current: {
		orderedItems: [
			row( '1786600000', '2026-08-20T10:00:00+00:00' ),
			row( '1786600060', '2026-08-20T10:01:00+00:00' ),
		],
	},
	totalItems: 2,
	totalPages: 1,
};

/** No-op selection handler; these tests never act on a choice. */
function noop() {}

/** Render the list with its real starting view. */
function renderList() {
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	render(
		<QueryClientProvider client={ client }>
			<ActivityList
				selectedId={ null }
				onSelect={ noop }
				view={ INITIAL_VIEW }
				onChangeView={ noop }
			/>
		</QueryClientProvider>
	);
}

beforeEach( () => {
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( PAGE );
	window.JP_CONNECTION_INITIAL_STATE = {
		connectionStatus: CONNECTED,
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

it( 'names each row by its own restore point, not by the shared summary', async () => {
	renderList();

	await expect(
		screen.findByRole( 'button', { name: `${ SUMMARY } Aug 20, 2026, 10:00 AM` } )
	).resolves.toBeInTheDocument();
	expect(
		screen.getByRole( 'button', { name: `${ SUMMARY } Aug 20, 2026, 10:01 AM` } )
	).toBeInTheDocument();
} );

it( 'no longer answers to the summary alone, which every row shares', async () => {
	renderList();
	await expect(
		screen.findByRole( 'button', { name: /Aug 20, 2026, 10:00 AM/ } )
	).resolves.toBeInTheDocument();

	expect( screen.queryByRole( 'button', { name: SUMMARY } ) ).not.toBeInTheDocument();
} );
