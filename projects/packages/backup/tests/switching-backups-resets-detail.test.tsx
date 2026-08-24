// Switching the selected backup must not carry the previous backup's
// file selection into the next one. Both backups here list a file at
// the same path — realistic, since most files survive between backups
// — which is exactly the case where a leftover `selected` set still
// matches a node in the new tree and renders as checked.

const mockApiFetch = jest.fn();
const mockSearch = jest.fn< Record< string, unknown >, [] >();
const mockNavigate = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
	useNavigate: () => mockNavigate,
	useParams: () => ( {} ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

// Testing Library's default `findBy` window is one second. These stages
// render behind several sequential requests, and a loaded CI runner under
// coverage has taken well over that for the same work locally-green here.
const SETTLE = { timeout: 10000 };

const REWIND_A = '1786644531.100';
const REWIND_B = '1786644532.200';

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );

/**
 * One rewindable-activity entry, in WPCOM's shape.
 *
 * @param rewindId - The backup's rewind id.
 * @param title    - The row's summary/title.
 * @return A raw activity entry.
 */
function backupEntry( rewindId: string, title: string ) {
	return {
		activity_id: `act-${ rewindId }`,
		gridicon: 'cloud',
		summary: title,
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: rewindId,
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '10 plugins, 4 themes' },
		name: 'rewind__backup_complete_full',
	};
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( o: { path?: string; data?: { rewind_id?: string } } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return Promise.resolve( {
				current: {
					orderedItems: [
						backupEntry( REWIND_A, 'Backup A complete' ),
						backupEntry( REWIND_B, 'Backup B complete' ),
					],
				},
				totalItems: 2,
				totalPages: 1,
			} );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path === '/jetpack/v4/backups' ) {
			return Promise.resolve( [] );
		}
		if ( path.includes( '/rewind/backup/ls' ) ) {
			// Both backups carry the same root file — the same file
			// surviving between backups is the ordinary case, not an edge
			// one.
			return Promise.resolve( { contents: { 'wp-config.php': { type: 'file', period: '123' } } } );
		}
		return Promise.resolve( {} );
	} );
	mockSearch.mockReset();
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

/**
 * The single root file's own checkbox. `getAllByRole` returns document
 * order: the tree has exactly one root file, so its row checkbox is
 * always the second one — the first is the tree's own "N selected"
 * summary checkbox, rendered above the tree.
 *
 * @return The file row's checkbox.
 */
function fileRowCheckbox(): HTMLElement {
	return screen.getAllByRole( 'checkbox' )[ 1 ];
}

describe( 'Switching between backups', () => {
	it( "clears the previous backup's file selection", async () => {
		mockSearch.mockReturnValue( { selected: REWIND_A } );
		const { rerender } = render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Backup A complete' }, SETTLE )
		).resolves.toBeInTheDocument();
		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' }, SETTLE )
		).resolves.toBeInTheDocument();
		await userEvent.click( fileRowCheckbox() );

		// Selecting the file swaps the header action's label off its default.
		// The mocked `<Link>` renders a plain `<a>` with no `href` (the real
		// component takes `to`), so it carries no implicit `link` role here.
		await expect(
			screen.findByText( 'Download 1 selected item', undefined, SETTLE )
		).resolves.toBeInTheDocument();

		mockSearch.mockReturnValue( { selected: REWIND_B } );
		rerender( <OverviewStage /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Backup B complete' }, SETTLE )
		).resolves.toBeInTheDocument();
		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' }, SETTLE )
		).resolves.toBeInTheDocument();

		// The new backup's own file — same path, never checked here — must
		// come up unselected, and the header must report zero selected.
		expect( fileRowCheckbox() ).not.toBeChecked();
		expect( screen.getByText( 'Download backup' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Download \d+ selected item/ ) ).not.toBeInTheDocument();
	} );
} );
