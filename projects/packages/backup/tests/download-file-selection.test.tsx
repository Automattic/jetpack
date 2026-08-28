// The file browser's selection has to survive the trip to the Download
// screen, and the Download screen has to act on it.
//
// Both halves are one behaviour. The detail pane relabels its Download
// action from the selection — "Download 3 selected items" — but until now
// the link carried only the rewind id, so the selection was dropped on
// navigation and the screen seeded the whole-site checklist regardless.
//
// What travels is not the display path. It is the opaque `id` off each
// `/rewind/backup/ls` entry (base64 of a volume-prefixed manifest path),
// comma-joined, because that is the form upstream's `include_path_list`
// takes — and it has to be a string, since a single id can itself contain
// a comma.
//
// The screen behaviour follows from the upstream shape: granular download
// is `types: { paths: true }`, one *of* the six categories rather than a
// filter across them. A request naming files cannot also name categories,
// so with a selection the checklist is not merely redundant — it offers
// choices the request cannot express, and is skipped.

const mockApiFetch = jest.fn();
const mockSearch = jest.fn< Record< string, unknown >, [] >();
const mockParams = jest.fn< { rewindId: string }, [] >();
const mockNavigate = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
	useNavigate: () => mockNavigate,
	useParams: () => mockParams(),
	// Unlike the bare `<a { ...rest }>` mock the other suites use, this one
	// models `search`: the real Link renders it into the href rather than
	// onto the DOM node, and the href is exactly what these tests are about.
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
import { stage as DownloadStage } from '../routes/download/stage';
import BackupDetail from '../src/dashboard/components/backup-detail';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { BackupActivityItem } from '../src/dashboard/types/activity';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const SETTLE = { timeout: 10000 };

const ITEM: BackupActivityItem = {
	id: 'act-cloud',
	kind: 'backup',
	title: 'Backup complete',
	publishedAt: '2026-08-13T18:08:56+00:00',
	actor: { type: 'Application', name: 'Jetpack' },
	rewindId: '1786644531.123',
	stats: '46 plugins, 23 themes',
	isComplete: true,
};

// `ZjU6L3dwLWNvbmZpZy5waHA=` decodes to `f5:/wp-config.php`, and
// `ZjI6L3JlYWRtZS5odG1s` to `f2:/readme.html` — the volume-prefixed
// manifest paths upstream identifies entries by. The `=` padding is here
// on purpose: it is the character a query-string round trip is most
// likely to mangle.
const WP_CONFIG_ID = 'ZjU6L3dwLWNvbmZpZy5waHA=';
const README_ID = 'ZjI6L3JlYWRtZS5odG1s';

/** Every box in the shared category checklist, by its accessible name. */
const ITEM_LABELS = [
	'WordPress themes',
	'WordPress plugins',
	'WordPress root',
	'WP-content directory',
	'Site database',
	'Media uploads',
];

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/rewind/backup/ls' ) ) {
			return Promise.resolve( {
				contents: {
					'wp-config.php': {
						type: 'file',
						period: '1786644531',
						manifest_path: 'f5:/wp-config.php',
						id: WP_CONFIG_ID,
					},
					'readme.html': {
						type: 'file',
						period: '1786644531',
						manifest_path: 'f2:/readme.html',
						id: README_ID,
					},
				},
			} );
		}
		if ( path.includes( '/backups/download/' ) ) {
			return Promise.resolve( { id: 4242 } );
		}
		return Promise.resolve( {} );
	} );
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockParams.mockReset();
	mockParams.mockReturnValue( { rewindId: ITEM.rewindId } );
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

/**
 * Every POST the dashboard issued, in call order. The download mutation
 * is the only POST this screen makes, so an empty list means nothing was
 * submitted.
 *
 * @return The matching apiFetch option objects.
 */
function postCalls() {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => options as { method?: string; path?: string } | undefined )
		.filter( options => options?.method === 'POST' );
}

describe( 'Download link carrying the file selection', () => {
	it( 'leaves the link bare when nothing is selected', async () => {
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);
		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' }, SETTLE )
		).resolves.toBeInTheDocument();

		expect( screen.getByRole( 'link', { name: /Download backup/ } ) ).toHaveAttribute(
			'href',
			'/download/1786644531.123'
		);
	} );

	it( 'carries the ls entry ids once files are ticked', async () => {
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);
		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' }, SETTLE )
		).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select wp-config.php' } ) );
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select readme.html' } ) );

		const link = await screen.findByRole( 'link', { name: /Download 2 selected items/ } );
		const href = link.getAttribute( 'href' ) ?? '';
		const query = new URLSearchParams( href.slice( href.indexOf( '?' ) ) );
		// Comma-joined as one string, not repeated params: upstream flattens
		// on comma, and an id can contain one.
		expect( query.get( 'files' ) ).toBe( `${ WP_CONFIG_ID },${ README_ID }` );

		// Restore is the outside witness. It sits beside Download and looks
		// symmetric, but a restore point is restored whole — so its link
		// must stay bare however Download's is built.
		expect( screen.getByRole( 'link', { name: /Restore to this point/ } ) ).toHaveAttribute(
			'href',
			'/restore/1786644531.123'
		);
	} );
} );

describe( 'Download screen without a file selection', () => {
	it( 'still offers the category checklist and submits nothing on its own', async () => {
		render( <DownloadStage /> );

		// The witness for "the checklist is here" is the control that acts
		// on it: the button exists and is armed, which only makes sense
		// alongside a list of categories to arm it.
		await expect(
			screen.findByRole( 'button', { name: /Generate download/ }, SETTLE )
		).resolves.toBeInTheDocument();
		for ( const label of ITEM_LABELS ) {
			expect( screen.getByRole( 'checkbox', { name: label } ) ).toBeChecked();
		}

		expect( postCalls() ).toHaveLength( 0 );
	} );
} );

describe( 'Download screen with a file selection', () => {
	beforeEach( () => {
		mockSearch.mockReturnValue( { files: `${ WP_CONFIG_ID },${ README_ID }` } );
	} );

	it( 'skips the checklist and starts building the archive', async () => {
		render( <DownloadStage /> );

		// Sibling witness rather than bare absence: the screen has moved on
		// to preparing the archive, which is the state that replaces the
		// checklist. A screen that rendered nothing at all would fail here.
		await expect(
			screen.findByText( 'Preparing download…', undefined, SETTLE )
		).resolves.toBeInTheDocument();

		for ( const label of ITEM_LABELS ) {
			expect( screen.queryByRole( 'checkbox', { name: label } ) ).not.toBeInTheDocument();
		}
		expect( screen.queryByRole( 'button', { name: /Generate download/ } ) ).not.toBeInTheDocument();
	} );

	it( 'asks WordPress.com for the archive once, without being clicked', async () => {
		render( <DownloadStage /> );

		await expect(
			screen.findByText( 'Preparing download…', undefined, SETTLE )
		).resolves.toBeInTheDocument();

		const posts = postCalls();
		expect( posts ).toHaveLength( 1 );
		expect( posts[ 0 ]?.path ).toContain( '/backups/download/1786644531.123' );
	} );

	it( 'does not start when the rewind id is malformed', async () => {
		mockSearch.mockReturnValue( { files: WP_CONFIG_ID } );
		mockParams.mockReturnValue( { rewindId: 'not-a-rewind-id' } );

		render( <DownloadStage /> );

		await expect(
			screen.findByText( "This download link isn't valid.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect( postCalls() ).toHaveLength( 0 );
	} );
} );
