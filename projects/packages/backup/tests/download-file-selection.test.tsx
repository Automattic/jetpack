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
	// Models `search`, which the real Link renders into the href rather
	// than onto the DOM node — and the href is what these tests are about.
	//
	// The suites still using a bare `<a { ...rest }>` mock get away with it
	// only because their `ls` fixtures carry no `id`, so `search` stays
	// undefined and React drops it. Give one of those fixtures an id and
	// the object reaches a DOM node, and `@wordpress/jest-console` fails
	// the suite on React's unknown-prop warning —
	// `restore-label-scope.test.tsx` and
	// `switching-backups-resets-detail.test.tsx` needed ids, so they carry
	// this same mock now.
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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
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
// manifest paths upstream identifies entries by. Base64 padding and all,
// since that is what the real ids look like; the serializer itself is
// mocked out here, so these do not exercise a URL round trip.
const WP_CONFIG_ID = 'ZjU6L3dwLWNvbmZpZy5waHA=';
const README_ID = 'ZjI6L3JlYWRtZS5odG1s';
// A directory id, which is itself a comma-joined token pair (`base64("r2:")
// + "," + base64("f2:/")`). It is why the include list is one comma-joined
// string upstream flattens, rather than a list of discrete values.
const THEMES_DIR_ID = 'cjI6,ZjI6Lw==';

/**
 * The root `ls` listing each test renders against. Reassigned before the
 * few tests that need a different tree — an id-less entry, or a folder.
 */
let lsContents: Record< string, Record< string, unknown > >;

/**
 * What the status poll answers with. Reassigned mid-test to let a
 * download finish, which is the only way to reach the success branch.
 */
let downloadStatus: Record< string, unknown >;

const TWO_FILES = {
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
};

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

	lsContents = TWO_FILES;
	downloadStatus = {
		id: 4242,
		status: 'running',
		progress: 36,
		url: '',
		valid_until: '',
		error: '',
	};
	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/rewind/backup/ls' ) ) {
			return Promise.resolve( { contents: lsContents } );
		}
		// Ordered before the initiate branch: the poll path is a suffix of
		// the initiate path, so a single `/backups/download/` test would
		// answer the poll with the initiate payload and no `status` at all.
		if ( path.includes( '/backups/download/' ) && path.includes( '/status' ) ) {
			return Promise.resolve( downloadStatus );
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

	// A ticked folder whose children were never expanded is ONE unit, not
	// an enumeration: upstream takes the folder's own id and pulls the
	// whole subtree. Both the label and the link depend on that rule, and
	// nothing pinned it before.
	it( 'sends one entry for a ticked folder nobody expanded', async () => {
		lsContents = {
			themes: { type: 'dir', has_children: true, id: THEMES_DIR_ID },
			'wp-config.php': TWO_FILES[ 'wp-config.php' ],
		};
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);
		await expect(
			screen.findByRole( 'button', { name: 'Folder: themes' }, SETTLE )
		).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select themes' } ) );

		const link = await screen.findByRole( 'link', { name: /Download 1 selected item/ } );
		const href = link.getAttribute( 'href' ) ?? '';
		expect( new URLSearchParams( href.slice( href.indexOf( '?' ) ) ).get( 'files' ) ).toBe(
			THEMES_DIR_ID
		);
	} );

	// The label and the link are built from the same list on purpose. An
	// entry upstream gave no `id` can be ticked in the tree and cannot be
	// named in a request — so counting ticked rows instead would promise
	// "Download 1 selected item" over a link carrying nothing, and hand
	// back a whole-site archive. That is the wrong-promise failure
	// JETPACK-2305 removes from Restore.
	it( 'does not promise a scope for entries the link cannot carry', async () => {
		lsContents = {
			// No `id`, as upstream is free to return.
			'orphan.php': { type: 'file', period: '1786644531', manifest_path: 'f5:/orphan.php' },
			'wp-config.php': TWO_FILES[ 'wp-config.php' ],
		};
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);
		await expect(
			screen.findByRole( 'button', { name: 'File: orphan.php' }, SETTLE )
		).resolves.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select orphan.php' } ) );

		// The tree still shows it as selected — that is the row's truth.
		expect( screen.getByRole( 'checkbox', { name: 'Select orphan.php' } ) ).toBeChecked();
		// The action does not claim a scope it cannot deliver.
		expect( screen.getByRole( 'link', { name: /Download backup/ } ) ).toHaveAttribute(
			'href',
			'/download/1786644531.123'
		);
		expect( screen.queryByText( /Download \d+ selected item/ ) ).not.toBeInTheDocument();

		// And it recovers: ticking a nameable entry alongside counts only
		// that one, so the label and the link agree again.
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select wp-config.php' } ) );

		const link = await screen.findByRole( 'link', { name: /Download 1 selected item/ } );
		const href = link.getAttribute( 'href' ) ?? '';
		expect( new URLSearchParams( href.slice( href.indexOf( '?' ) ) ).get( 'files' ) ).toBe(
			WP_CONFIG_ID
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

		// The other half of "unchanged": the waiting state the selection
		// path jumps straight into must not appear here. Without this the
		// no-selection path could start auto-generating and every
		// assertion above would still pass.
		expect( screen.queryByText( 'Preparing download…' ) ).not.toBeInTheDocument();
		expect( postCalls() ).toHaveLength( 0 );
	} );

	// A `files` param naming nothing is not a selection. Commas alone can
	// survive a hand-edited or truncated URL, and treating that as a
	// selection would skip the checklist and submit with no way back.
	it.each( [
		[ 'empty', '' ],
		[ 'commas only', ',,' ],
	] )( 'treats a %s files param as no selection', async ( _label, files ) => {
		mockSearch.mockReturnValue( { files } );

		render( <DownloadStage /> );

		await expect(
			screen.findByRole( 'button', { name: /Generate download/ }, SETTLE )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Preparing download…' ) ).not.toBeInTheDocument();
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

	// The wait has two frames, and the handover is the whole of it: a
	// spinner only until there is a download id to poll, then the bar.
	//
	// StrictMode is load-bearing, not decoration. The archive is asked for
	// from a mount effect, and React Query detaches the mutation observer
	// on StrictMode's simulated unmount without ever reattaching it — so
	// the settle never reaches the hook and `isPending` stays true for
	// good, while the mutation's own `onSuccess` still lands the id and
	// starts the poll. That is the shape this screen shipped in: a healthy
	// poll climbing behind a spinner that never became a bar. Drop the
	// wrapper and this test passes either way.
	it( 'hands the wait over to the progress bar once the poll answers', async () => {
		render(
			<StrictMode>
				<DownloadStage />
			</StrictMode>
		);

		// The bar arrives at 0% — its opening frame, while WPCOM still has
		// the job queued — so waiting on the element alone would pass on a
		// bar that never took a number from the poll. The polled value is
		// the assertion that matters.
		const bar = await screen.findByRole( 'progressbar', undefined, SETTLE );
		// A number, not a string: `toHaveValue` on `<progress>` reads
		// `element.value`, which the DOM has already coerced.
		await waitFor( () => expect( bar ).toHaveValue( 36 ), SETTLE );
		// The spinner is the state the bar replaces, so its departure is
		// half the behaviour. `Spinner` renders an explicit
		// `role="presentation"`, which is the handle on it.
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
	} );

	// The same latch that hid the bar also hid the ending. `isPending` was
	// read above every other branch, so a frozen one shadowed `success`
	// and `failed` too: the archive could finish, signed URL and all, and
	// the screen would still be sitting on the spinner with nothing to
	// click. Reported as "upon finishing, the spinner remains there and
	// nothing happened" — the same defect as the missing bar, one branch
	// further on.
	it( 'shows the finished archive rather than staying on the spinner', async () => {
		render(
			<StrictMode>
				<DownloadStage />
			</StrictMode>
		);

		// Wait for a live poll first, so the flip below lands on a screen
		// that is genuinely waiting rather than one still mid-POST.
		await expect(
			screen.findByRole( 'progressbar', undefined, SETTLE )
		).resolves.toBeInTheDocument();

		downloadStatus = {
			id: 4242,
			status: 'finished',
			progress: 100,
			url: 'https://example.com/archive.zip',
			valid_until: '2026-09-04T00:00:00+00:00',
			error: '',
		};

		const link = await screen.findByRole( 'link', { name: 'Download the file' }, SETTLE );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/archive.zip' );
		// `Notice` also speaks its text through `wp.a11y.speak`, which
		// mirrors the string into a live region — so an unscoped query
		// matches twice. The visible notice is the one under assertion.
		expect(
			screen.getByText( 'Your download is ready.', {
				ignore: '.a11y-speak-region, script, style',
			} )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'presentation' ) ).not.toBeInTheDocument();
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
