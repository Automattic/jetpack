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

// Real markup, so the SVG case can assert the card shows the source rather
// than rendering it. Kept to one line: Testing Library normalizes whitespace
// before matching, so a multi-line fixture would match on shape it does not
// actually have.
const SVG_BODY = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';

/** One backup root holding a file per extension under test. */
const CONTENTS = {
	'app.js': { type: 'file', period: '1786644531', manifest_path: 'f5:/app.js' },
	'sitemap.xml': { type: 'file', period: '1786644531', manifest_path: 'f5:/sitemap.xml' },
	'logo.svg': { type: 'file', period: '1786644531', manifest_path: 'f5:/logo.svg' },
	'readme.txt': { type: 'file', period: '1786644531', manifest_path: 'f5:/readme.txt' },
	'photo.heic': { type: 'file', period: '1786644531', manifest_path: 'f5:/photo.heic' },
	'weird.__proto__': {
		type: 'file',
		period: '1786644531',
		manifest_path: 'f5:/weird.__proto__',
	},
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
	await expect( screen.findByRole( 'heading', { name, level: 3 } ) ).resolves.toBeInTheDocument();
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( options: { path: string } ) => {
		if ( options.path.includes( '/rewind/backup/file-content' ) ) {
			// The route carries the manifest path base64-encoded, so decode it
			// to answer per file rather than handing every file one body.
			const encoded = new URL( options.path, 'https://example.test' ).searchParams.get(
				'encoded_manifest_path'
			);
			const path = encoded ? atob( encoded ) : '';
			return Promise.resolve( {
				content: path.endsWith( '.svg' ) ? SVG_BODY : PREVIEW_BODY,
			} );
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
		[ 'app.js', 'application/javascript', PREVIEW_BODY ],
		[ 'sitemap.xml', 'application/xml', PREVIEW_BODY ],
		[ 'logo.svg', 'image/svg+xml', SVG_BODY ],
	] )( 'previews %s and labels it %s', async ( name, mime, body ) => {
		await openFile( name );

		await expect( screen.findByText( body ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( mime ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Preview unavailable for this file.' ) ).not.toBeInTheDocument();
	} );

	// The case above only proves an extension in the map previews. `.svg` is in
	// the map on the understanding that the card shows the source and never
	// renders the image, and nothing above would notice that changing: swapping
	// the `<pre>` for `dangerouslySetInnerHTML`, or adding an `<img>` branch on
	// `image/*`, keeps every other test green.
	it( 'shows SVG source as text and never parses it into markup', async () => {
		await openFile( 'logo.svg' );

		const pre = await screen.findByText( SVG_BODY );

		// React escapes string children, so the markup arrives as entities. Were
		// the source injected instead, it would arrive as real tags and a
		// `<rect>` element would exist. Asserting on this element's own HTML
		// rather than querying the container for `svg` matters -- the card's
		// close button draws one, so a container-wide query always finds it.
		expect( pre.tagName ).toBe( 'PRE' );
		expect( pre.innerHTML ).toContain( '&lt;svg' );
		expect( pre.innerHTML ).not.toContain( '<rect' );
	} );

	// The card must still refuse formats it cannot render as text, or the
	// fix above would have swapped one wrong answer for another: raw bytes
	// in a `<pre>`.
	it( 'refuses a file whose extension is not a text format', async () => {
		await openFile( 'photo.heic' );

		expect( screen.getByText( 'Preview unavailable for this file.' ) ).toBeInTheDocument();
		expect( screen.queryByText( PREVIEW_BODY ) ).not.toBeInTheDocument();
	} );

	// The map is an object literal, so a plain `map[ ext ]` lookup reaches the
	// prototype chain. `__proto__` and `constructor` are the two extensions that
	// resolve to something non-null there, and the value is not a string -- so
	// without an own-value check this both previews and throws "Objects are not
	// valid as a React child" when the mime reaches the `Type:` row.
	it( 'refuses an extension that only resolves through the prototype chain', async () => {
		await openFile( 'weird.__proto__' );

		expect( screen.getByText( 'Preview unavailable for this file.' ) ).toBeInTheDocument();
	} );

	// `showPreview` also gates the query, so an unpreviewable file must
	// not spend a request fetching bytes nothing will render.
	it( 'does not request contents for an unpreviewable file', async () => {
		await openFile( 'photo.heic' );

		const paths = mockApiFetch.mock.calls.map( ( [ options ] ) => options.path );
		expect( paths.some( ( path: string ) => path.includes( 'file-content' ) ) ).toBe( false );
	} );
} );

describe( 'the size row', () => {
	// A truthiness gate in place of the card's `size !== null` would pass
	// every other case here and silently drop the row for a zero-byte file.
	it( 'renders a zero-byte size rather than suppressing the row', async () => {
		mockApiFetch.mockImplementation( ( options: { path: string } ) =>
			Promise.resolve(
				options.path.includes( '/rewind/backup/path-info' ) ? { size: '0' } : { contents: CONTENTS }
			)
		);

		await openFile( 'photo.heic' );

		await expect( screen.findByText( '0 B' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Size:' ) ).toBeInTheDocument();
	} );
} );
