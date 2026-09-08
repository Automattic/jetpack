// JETPACK-2353 — clicking `wp-config.php` printed `DB_PASSWORD` and the salts
// straight into the `<pre>`. JETPACK-2474 widened the gate to a pattern family.

const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileInfoCard from '../src/dashboard/components/file-info-card';
import FileInfoDialog from '../src/dashboard/components/file-info-dialog';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { FileNodeFile } from '../src/dashboard/types/file-tree';

/** Closing is irrelevant to these assertions; both chromes render regardless. */
const noop = () => {};

// Not a real credential — a marker whose only job is to be searched for.
const SECRET = "define( 'DB_PASSWORD', 'hunter2-not-a-real-password' );";
const PLAIN = 'msgid "Hello"';

const WP_CONFIG: FileNodeFile = {
	name: 'wp-config.php',
	path: '/wp-config.php',
	type: 'file',
	period: '1786644531',
	manifestPath: 'f5:/wp-config.php',
};

const STAGING_WP_CONFIG: FileNodeFile = {
	name: 'wp-config.php',
	path: '/staging/wp-config.php',
	type: 'file',
	period: '1786644531',
	manifestPath: 'f5:/staging/wp-config.php',
};

const README: FileNodeFile = {
	name: 'readme.txt',
	path: '/readme.txt',
	type: 'file',
	period: '1786644531',
	manifestPath: 'f5:/readme.txt',
};

const HIDDEN = 'This preview is hidden because it contains sensitive information.';
const UNAVAILABLE = 'Preview unavailable for this file.';
const SHOW = /show preview/i;

/**
 * Answer `/file-content` with the given body, and `/path-info` with a size.
 *
 * @param content - What the preview fetch returns when it runs.
 */
function mockEndpoints( content: string ): void {
	mockApiFetch.mockImplementation( ( options: { path: string } ) =>
		Promise.resolve(
			options.path.includes( '/file-content' )
				? { content, is_text: true, truncated: false }
				: { size: 3899 }
		)
	);
}

/**
 * How many preview fetches have gone out.
 *
 * `/path-info` runs regardless, so counting every request is the wrong measure.
 *
 * @return The number of `/file-content` requests.
 */
function contentFetches(): number {
	return mockApiFetch.mock.calls.filter( ( [ opts ] ) =>
		String( opts?.path ?? '' ).includes( '/file-content' )
	).length;
}

/**
 * Whether the preview fetch has gone out at all.
 *
 * @return True when `/file-content` was requested.
 */
function fetchedContent(): boolean {
	return contentFetches() > 0;
}

/**
 * Render one file's card inside the dashboard's query client.
 *
 * @param file - The file node to open.
 * @return The Testing Library render result.
 */
function renderCard( file: FileNodeFile ) {
	return render(
		<QueryClientProvider>
			<FileInfoCard file={ file } onClose={ noop } />
		</QueryClientProvider>
	);
}

/**
 * Render one file's dialog, the chrome a panel too narrow for the card uses.
 *
 * @param file - The file node to open.
 * @return The Testing Library render result.
 */
function renderDialog( file: FileNodeFile ) {
	return render(
		<QueryClientProvider>
			<FileInfoDialog file={ file } onClose={ noop } />
		</QueryClientProvider>
	);
}

/**
 * A file node for the given path below the backup root.
 *
 * @param path - Path below the root, e.g. `/wp-config.old.php`.
 * @return The file node the tree would hand the card.
 */
function fileAt( path: string ): FileNodeFile {
	return {
		name: path.slice( path.lastIndexOf( '/' ) + 1 ),
		path,
		type: 'file',
		period: '1786644531',
		manifestPath: `f5:${ path }`,
	};
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
	mockRecordEvent.mockReset();
} );

describe( 'sensitive preview gate', () => {
	it( 'hides the root wp-config.php and never fetches it', async () => {
		mockEndpoints( SECRET );

		renderCard( WP_CONFIG );

		// The heading and the `Type:` row are the positive control: the card
		// rendered and called the extension previewable, so the absent body
		// below is this gate and not a tree that threw.
		await expect(
			screen.findByRole( 'heading', { name: 'wp-config.php', level: 3 } )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Type:' ) ).toBeInTheDocument();
		expect( screen.getByText( HIDDEN ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: SHOW } ) ).toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
		expect( fetchedContent() ).toBe( false );
	} );

	it( 'shows the contents once the reader asks', async () => {
		mockEndpoints( SECRET );
		renderCard( WP_CONFIG );

		await userEvent.click( await screen.findByRole( 'button', { name: SHOW } ) );

		await expect( screen.findByText( SECRET ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( HIDDEN ) ).not.toBeInTheDocument();
	} );

	it( 'records the reveal, and records nothing before it', async () => {
		mockEndpoints( SECRET );
		renderCard( WP_CONFIG );

		const button = await screen.findByRole( 'button', { name: SHOW } );
		expect( mockRecordEvent ).not.toHaveBeenCalled();

		await userEvent.click( button );

		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_backup_browser_preview_file_sensitive_click'
		);
		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	// The gate is per visit, not per file. Deriving the flag from file identity
	// alone would leave the reveal sticky for the card's lifetime, because the
	// identity is unchanged on the way back.
	it( 'hides it again after a detour to another file', async () => {
		mockEndpoints( SECRET );
		const { rerender } = renderCard( WP_CONFIG );

		await userEvent.click( await screen.findByRole( 'button', { name: SHOW } ) );
		await expect( screen.findByText( SECRET ) ).resolves.toBeInTheDocument();

		// Swapping the prop rather than remounting, which is what the browser does.
		rerender(
			<QueryClientProvider>
				<FileInfoCard file={ README } onClose={ noop } />
			</QueryClientProvider>
		);
		rerender(
			<QueryClientProvider>
				<FileInfoCard file={ WP_CONFIG } onClose={ noop } />
			</QueryClientProvider>
		);

		await expect( screen.findByText( HIDDEN ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
	} );

	// Calypso keys on the whole `f5:/wp-config.php`. The `5` is VaultPress's
	// data-type code, so a file it typed differently would slip a literal match.
	it( 'hides it whatever data-type prefix the manifest carries', async () => {
		mockEndpoints( SECRET );

		renderCard( { ...WP_CONFIG, manifestPath: 'f7:/wp-config.php' } );

		await expect( screen.findByText( HIDDEN ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
	} );

	// A second install under the backed-up root — `/staging/`, `/blog/`, a
	// migration leftover — holds live credentials for a live database.
	it( 'hides a wp-config.php below the manifest root', async () => {
		mockEndpoints( SECRET );

		renderCard( STAGING_WP_CONFIG );

		await expect( screen.findByText( HIDDEN ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
		expect( fetchedContent() ).toBe( false );
	} );

	// Near-misses on all five: the two name-anchored patterns need a segment to
	// start with the name, and the three extension patterns need the dot.
	it.each( [
		[ '/wp-content/mywp-config.php' ],
		[ '/config/app.php' ],
		[ '/wp-content/env.php' ],
		[ '/changelog.txt' ],
		[ '/wp-content/uploads/mysql.txt' ],
	] )( 'leaves %s alone', async path => {
		mockEndpoints( PLAIN );

		renderCard( fileAt( path ) );

		await expect( screen.findByText( PLAIN ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( HIDDEN ) ).not.toBeInTheDocument();
	} );

	// `config/application.php` is Bedrock's, where the credentials live instead.
	it.each( [
		[ '/wp-config-backup.php' ],
		[ '/wp-config.old.php' ],
		[ '/wp-config.php.txt' ],
		[ '/config/application.php' ],
		[ '/config/application.old.php' ],
		[ '/config/application.php.txt' ],
		[ '/.env.txt' ],
		[ '/production.env.txt' ],
		[ '/dump.sql' ],
		[ '/dump.sql.txt' ],
		[ '/wp-content/uploads/db-backup.sql.txt' ],
		[ '/wp-content/debug.log' ],
		[ '/wp-content/debug.log.txt' ],
		[ '/wp-content/error.log.txt' ],
	] )( 'hides %s and never fetches it', async path => {
		mockEndpoints( SECRET );

		renderCard( fileAt( path ) );

		await expect( screen.findByText( HIDDEN ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
		expect( fetchedContent() ).toBe( false );
	} );

	// Two gated files in one tree is what makes the stale-reveal render
	// reachable: the card is not remounted, so on the render that swaps the
	// prop the old `revealed` is still true and the query commits enabled.
	it( 'does not carry a reveal from one wp-config.php to another', async () => {
		mockEndpoints( SECRET );
		const { rerender } = renderCard( WP_CONFIG );

		await userEvent.click( await screen.findByRole( 'button', { name: SHOW } ) );
		await expect( screen.findByText( SECRET ) ).resolves.toBeInTheDocument();
		expect( contentFetches() ).toBe( 1 );

		rerender(
			<QueryClientProvider>
				<FileInfoCard file={ STAGING_WP_CONFIG } onClose={ noop } />
			</QueryClientProvider>
		);

		await expect( screen.findByText( HIDDEN ) ).resolves.toBeInTheDocument();
		expect( contentFetches() ).toBe( 1 );
	} );

	it( 'leaves an ordinary text file alone', async () => {
		mockEndpoints( PLAIN );

		renderCard( {
			name: 'jetpack.po',
			path: '/languages/jetpack.po',
			type: 'file',
			period: '1786644531',
			manifestPath: 'f5:/languages/jetpack.po',
		} );

		await expect( screen.findByText( PLAIN ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( HIDDEN ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: SHOW } ) ).not.toBeInTheDocument();
	} );

	// The pattern matches this one too, and the map still wins.
	it( 'refuses a wp-config.php.bak outright rather than offering a reveal', async () => {
		mockEndpoints( SECRET );

		renderCard( fileAt( '/wp-config.php.bak' ) );

		await expect( screen.findByText( UNAVAILABLE ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: SHOW } ) ).not.toBeInTheDocument();
		expect( fetchedContent() ).toBe( false );
	} );

	it( 'shows a database dump once the reader asks', async () => {
		mockEndpoints( SECRET );
		renderCard( fileAt( '/dump.sql' ) );

		await userEvent.click( await screen.findByRole( 'button', { name: SHOW } ) );

		await expect( screen.findByText( SECRET ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( UNAVAILABLE ) ).not.toBeInTheDocument();
	} );

	it( 'hands focus to the preview it just revealed', async () => {
		mockEndpoints( SECRET );
		renderCard( WP_CONFIG );

		await userEvent.click( await screen.findByRole( 'button', { name: SHOW } ) );

		// The click unmounts the button holding focus, so without a handback the
		// next Tab starts again at the top of the tree.
		await waitFor( () =>
			expect( screen.getByRole( 'region', { name: /Preview of wp-config.php/ } ) ).toHaveFocus()
		);
	} );

	it( 'gates a differently-cased wp-config.php', async () => {
		// `mimeFromName` lowercases the extension, so an uppercase name is still
		// previewable — the gate has to match the same way or it fails open.
		mockEndpoints( SECRET );

		renderCard( { ...WP_CONFIG, name: 'WP-CONFIG.PHP', manifestPath: 'f5:/WP-CONFIG.PHP' } );

		await expect( screen.findByText( HIDDEN ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
		expect( fetchedContent() ).toBe( false );
	} );

	// The dialog shares only `useFileInfo` with the card, so the two surfaces
	// can diverge without either one failing.
	describe( 'the dialog chrome', () => {
		it( 'gates a sensitive file there too, and still withholds the fetch', async () => {
			mockEndpoints( SECRET );

			renderDialog( WP_CONFIG );

			// The heading level is what separates the two chromes; without it
			// `HIDDEN` alone would pass for a dialog delegating to the card.
			await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();
			expect(
				screen.getByRole( 'heading', { level: 2, name: 'wp-config.php' } )
			).toBeInTheDocument();

			expect( screen.getByText( HIDDEN ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: SHOW } ) ).toBeInTheDocument();
			expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
			expect( fetchedContent() ).toBe( false );
		} );

		it( 'reveals on a second click and hands focus to the preview, as the card does', async () => {
			mockEndpoints( SECRET );

			renderDialog( WP_CONFIG );
			await userEvent.click( await screen.findByRole( 'button', { name: SHOW } ) );

			await expect( screen.findByText( SECRET ) ).resolves.toBeInTheDocument();
			await waitFor( () =>
				expect( screen.getByRole( 'region', { name: /Preview of wp-config.php/ } ) ).toHaveFocus()
			);
		} );
	} );
} );
