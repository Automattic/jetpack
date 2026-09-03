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
	// `search` is folded into the href rather than spread onto the node: the
	// Download action carries the file selection there now, and React would
	// warn about an object-valued attribute on an `<a>` — which
	// `@wordpress/jest-console` turns into a suite failure.
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
			// `id` is what a granular download names the entry by. The
			// Download label counts nameable entries, so without it the
			// selection this suite tracks would be invisible.
			return Promise.resolve( {
				contents: {
					'wp-config.php': { type: 'file', period: '123', id: 'ZjU6L3dwLWNvbmZpZy5waHA=' },
				},
			} );
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
 * The single root file's own checkbox.
 *
 * Addressed by name. Row checkboxes had no accessible name until #51616,
 * which is why this used to exclude the tree's named summary checkbox and
 * count what was left — the name is the better handle now that there is one.
 *
 * @return The file row's checkbox.
 */
function fileRowCheckbox(): HTMLElement {
	return screen.getByRole( 'checkbox', { name: 'Select wp-config.php' } );
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

		// Selecting the file swaps the Download action off its default. The
		// mocked `<Link>` renders a plain `<a>` with no `href` (the real
		// component takes `to`), so it carries no implicit `link` role here.
		//
		// Download is the only header action that moves. Restore is
		// deliberately constant — a restore point is restored whole, so it
		// never counts the selection — which makes it useless as a reset
		// signal here. Its constancy is `restore-label-scope.test.tsx`.
		await expect(
			screen.findByText( 'Download 1 selected item', undefined, SETTLE )
		).resolves.toBeInTheDocument();

		// Open the file's preview as well. A regression that cleared the
		// selection but left `openFile` set would otherwise pass.
		await userEvent.click( screen.getByRole( 'button', { name: 'File: wp-config.php' } ) );
		await expect(
			screen.findByRole( 'button', { name: 'Close preview' }, SETTLE )
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
		expect( screen.queryByRole( 'button', { name: 'Close preview' } ) ).not.toBeInTheDocument();
		expect( fileRowCheckbox() ).not.toBeChecked();
		expect( screen.getByText( 'Download backup' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Download \d+ selected item/ ) ).not.toBeInTheDocument();
	} );

	// The other half of the invariant. Keying by `rewindId` makes the
	// lifetime of the reader's selection depend on that id staying stable
	// across refetches. It does today — the normalizer derives it per
	// entry — but were it ever to vary (a synthesized id, a shape change
	// upstream), the selection would be wiped mid-task on every
	// activity-log refetch and the test above would stay green.
	it( 'keeps the selection when the same backup is re-rendered', async () => {
		mockSearch.mockReturnValue( { selected: REWIND_A } );
		const { rerender } = render( <OverviewStage /> );

		await expect(
			screen.findByRole( 'heading', { name: 'Backup A complete' }, SETTLE )
		).resolves.toBeInTheDocument();
		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' }, SETTLE )
		).resolves.toBeInTheDocument();
		await userEvent.click( fileRowCheckbox() );
		await expect(
			screen.findByText( 'Download 1 selected item', undefined, SETTLE )
		).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'File: wp-config.php' } ) );
		await expect(
			screen.findByRole( 'button', { name: 'Close preview' }, SETTLE )
		).resolves.toBeInTheDocument();

		// Same backup, so the key is unchanged and nothing should remount.
		rerender( <OverviewStage /> );

		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( fileRowCheckbox() ).toBeChecked();
		expect( screen.getByText( 'Download 1 selected item' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Close preview' } ) ).toBeInTheDocument();
	} );
} );
