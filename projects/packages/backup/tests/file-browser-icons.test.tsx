// `@wordpress/icons` export names do not describe what they draw, so the
// file-browser aliases look inverted and invite a "correction". These
// tests cross-check each row against the package's own artwork instead of
// a copied path string, so they survive an icons upgrade but fail if the
// aliases are swapped back.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import { Icon, file, page } from '@wordpress/icons';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { ReactElement } from 'react';

/** Selection is irrelevant here; the rows render regardless. */
const noop = () => {};

/**
 * Every `<svg>` under `root`, reduced to its drawn shape: the `d` data of
 * its paths, in order. Two icons are the same glyph when their shapes are
 * equal, whatever the export is called.
 *
 * @param root - Element to scan.
 * @return One shape string per `<svg>`, in DOM order.
 */
function shapesIn( root: Element ): string[] {
	return Array.from( root.querySelectorAll( 'svg' ) ).map( svg =>
		Array.from( svg.querySelectorAll( 'path' ) )
			.map( path => path.getAttribute( 'd' ) ?? '' )
			.join( '|' )
	);
}

/**
 * Shape of one `@wordpress/icons` export, taken from the package itself
 * rather than a path literal copied into this file. That is what keeps
 * these assertions correct when upstream redraws the artwork.
 *
 * @param icon - The icon element to render.
 * @return Its shape string.
 */
function shapeOf( icon: ReactElement ): string {
	const { container, unmount } = render( <Icon icon={ icon } size={ 18 } /> );
	const [ shape ] = shapesIn( container );
	unmount();
	return shape;
}

/**
 * Render the browser over a backup root holding one folder and one file.
 *
 * @return The two row buttons, once the root listing has resolved.
 */
async function renderRows(): Promise< { folderRow: HTMLElement; fileRow: HTMLElement } > {
	render(
		<QueryClientProvider>
			<FileBrowser
				rewindId="1786644531.123"
				selection={ EMPTY_FILE_SELECTION }
				onSelectionChange={ noop }
			/>
		</QueryClientProvider>
	);

	return {
		folderRow: await screen.findByRole( 'button', { name: 'wp-content' } ),
		fileRow: screen.getByRole( 'button', { name: 'wp-config.php' } ),
	};
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( {
		contents: {
			'wp-content': { type: 'dir', has_children: true },
			'wp-config.php': { type: 'file', period: '1786644531' },
		},
	} );
} );

describe( 'file browser row icons', () => {
	// A cross-check against two identical glyphs would pass no matter how
	// the rows were wired, so state the premise as its own assertion.
	it( 'draws `file` and `page` as different glyphs', () => {
		expect( shapeOf( file ) ).not.toBe( '' );
		expect( shapeOf( page ) ).not.toBe( '' );
		expect( shapeOf( file ) ).not.toBe( shapeOf( page ) );
	} );

	it( 'draws a different glyph on a folder row than on a file row', async () => {
		const { folderRow, fileRow } = await renderRows();

		// The folder row also carries an expand chevron, so compare the
		// file row's single icon against everything the folder row draws.
		const [ fileRowShape ] = shapesIn( fileRow );
		expect( fileRowShape ).not.toBe( '' );
		expect( shapesIn( folderRow ) ).not.toContain( fileRowShape );
	} );

	it( 'draws the `file` export — the folder glyph — on a folder row', async () => {
		const { folderRow } = await renderRows();

		expect( shapesIn( folderRow ) ).toContain( shapeOf( file ) );
		expect( shapesIn( folderRow ) ).not.toContain( shapeOf( page ) );
	} );

	it( 'draws the `page` export — the document glyph — on a file row', async () => {
		const { fileRow } = await renderRows();

		expect( shapesIn( fileRow ) ).toContain( shapeOf( page ) );
		expect( shapesIn( fileRow ) ).not.toContain( shapeOf( file ) );
	} );
} );
