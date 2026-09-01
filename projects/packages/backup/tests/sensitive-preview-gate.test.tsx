// JETPACK-2353 — clicking `wp-config.php` printed `DB_PASSWORD` and the salts
// straight into the `<pre>`. Calypso already hides the same single file behind
// a "Show preview" click; this is that gate, ported.

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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileInfoCard from '../src/dashboard/components/file-info-card';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { FileNodeFile } from '../src/dashboard/types/file-tree';

/** Closing is irrelevant to these assertions; the card renders regardless. */
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
 * Whether the preview fetch has gone out at all.
 *
 * `/path-info` runs regardless, so "no request" is the wrong assertion.
 *
 * @return True when `/file-content` was requested.
 */
function fetchedContent(): boolean {
	return mockApiFetch.mock.calls.some( ( [ opts ] ) =>
		String( opts?.path ?? '' ).includes( '/file-content' )
	);
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

	// The card is not remounted per file, so the reveal has to be per-file state
	// rather than a latch that outlives the file it was granted for.
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

	// Why the gate names one path instead of a family: a stray backup copy is
	// already unpreviewable, because `bak` is not in the extension map.
	it( 'needs no entry for a wp-config.php.bak, which never previews at all', async () => {
		mockEndpoints( SECRET );

		renderCard( {
			name: 'wp-config.php.bak',
			path: '/wp-config.php.bak',
			type: 'file',
			period: '1786644531',
			manifestPath: 'f5:/wp-config.php.bak',
		} );

		await expect( screen.findByText( UNAVAILABLE ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( SECRET ) ).not.toBeInTheDocument();
		expect( fetchedContent() ).toBe( false );
	} );
} );
