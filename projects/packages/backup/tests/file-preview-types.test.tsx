// The card decides previewability from the file's extension. Two
// allowlists used to make that decision — an extension→mime map, then a
// narrower mime check — and `.js`, `.xml` and `.svg` passed the first and
// failed the second. Each showed its own mime type on the `Type:` row and
// "Preview unavailable" underneath it, in the same card.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

/** Selection is irrelevant here; the rows render regardless. */
const noop = () => {};

const PREVIEW_BODY = 'console.log( "hello" );';

/** One backup root holding a file per extension under test. */
const CONTENTS = {
	'app.js': { type: 'file', period: '1786644531', manifest_path: 'f5:/app.js' },
	'sitemap.xml': { type: 'file', period: '1786644531', manifest_path: 'f5:/sitemap.xml' },
	'logo.svg': { type: 'file', period: '1786644531', manifest_path: 'f5:/logo.svg' },
	'readme.txt': { type: 'file', period: '1786644531', manifest_path: 'f5:/readme.txt' },
	'photo.heic': { type: 'file', period: '1786644531', manifest_path: 'f5:/photo.heic' },
};

/**
 * Open the named file's info card. Only one card is open at a time, so
 * the assertions that follow can read the whole screen.
 *
 * @param name - Filename as it appears in the tree.
 */
async function openFile( name: string ): Promise< void > {
	render(
		<QueryClientProvider>
			<FileBrowser
				rewindId="1786644531.123"
				selection={ EMPTY_FILE_SELECTION }
				onSelectionChange={ noop }
			/>
		</QueryClientProvider>
	);

	await userEvent.click( await screen.findByRole( 'button', { name: `File: ${ name }` } ) );
	await expect( screen.findByRole( 'heading', { name, level: 4 } ) ).resolves.toBeInTheDocument();
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( options: { path: string } ) => {
		if ( options.path.includes( '/rewind/backup/file-content' ) ) {
			return Promise.resolve( { content: PREVIEW_BODY } );
		}
		if ( options.path.includes( '/rewind/backup/path-info' ) ) {
			return Promise.resolve( { size: 42 } );
		}
		return Promise.resolve( { contents: CONTENTS } );
	} );
} );

describe( 'file preview types', () => {
	// The premise: `.txt` already previewed before this change, so a
	// passing `.js` case below is about the extension, not about the
	// preview slot working at all.
	it( 'previews a .txt file', async () => {
		await openFile( 'readme.txt' );

		await expect( screen.findByText( PREVIEW_BODY ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'text/plain' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'app.js', 'application/javascript' ],
		[ 'sitemap.xml', 'application/xml' ],
		[ 'logo.svg', 'image/svg+xml' ],
	] )( 'previews %s and labels it %s', async ( name, mime ) => {
		await openFile( name );

		await expect( screen.findByText( PREVIEW_BODY ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( mime ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Preview unavailable for this file.' ) ).not.toBeInTheDocument();
	} );

	// The card must still refuse formats it cannot render as text, or the
	// fix above would have swapped one wrong answer for another: raw bytes
	// in a `<pre>`.
	it( 'refuses a file whose extension is not a text format', async () => {
		await openFile( 'photo.heic' );

		expect( screen.getByText( 'Preview unavailable for this file.' ) ).toBeInTheDocument();
		expect( screen.queryByText( PREVIEW_BODY ) ).not.toBeInTheDocument();
	} );

	// `showPreview` also gates the query, so an unpreviewable file must
	// not spend a request fetching bytes nothing will render.
	it( 'does not request contents for an unpreviewable file', async () => {
		await openFile( 'photo.heic' );

		const paths = mockApiFetch.mock.calls.map( ( [ options ] ) => options.path );
		expect( paths.some( ( path: string ) => path.includes( 'file-content' ) ) ).toBe( false );
	} );
} );
