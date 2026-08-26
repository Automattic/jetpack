// The file browser is operable with a mouse but was not with a keyboard or a
// screen reader: row checkboxes had no name, the folder toggle's
// `aria-expanded` pointed at nothing, the preview was a scroll region no
// focus could enter, and a folder that failed to load said nothing.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

/** Selection is irrelevant to these assertions; the rows render regardless. */
const noop = () => {};

const ROOT = {
	'wp-content': { type: 'dir', has_children: true },
	'wp-config.php': { type: 'file', period: '1786644531', manifest_path: 'f5:/wp-config.php' },
};

/**
 * Render the browser over the root listing.
 *
 * @return Nothing; assertions read from `screen`.
 */
async function renderBrowser(): Promise< void > {
	render(
		<QueryClientProvider>
			<FileBrowser
				rewindId="1786644531.123"
				selection={ EMPTY_FILE_SELECTION }
				onSelectionChange={ noop }
			/>
		</QueryClientProvider>
	);
	await expect(
		screen.findByRole( 'button', { name: 'Folder: wp-content' } )
	).resolves.toBeInTheDocument();
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( options: { path: string; data?: { path?: string } } ) => {
		if ( options.path.includes( '/rewind/backup/file-content' ) ) {
			return Promise.resolve( { content: 'define( "X", 1 );' } );
		}
		if ( options.path.includes( '/rewind/backup/path-info' ) ) {
			return Promise.resolve( { size: 42 } );
		}
		return Promise.resolve( { contents: ROOT } );
	} );
} );

describe( 'row checkboxes', () => {
	// `CheckboxControl` renders its `<label>` only under `label && …`, so the
	// `label=""` this used to pass emitted no label element and left the input
	// unnamed. Asserting the name is what catches a revert to `label=""`.
	it( 'names each checkbox after the row it selects', async () => {
		await renderBrowser();

		expect( screen.getByRole( 'checkbox', { name: 'Select wp-config.php' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Select wp-content' } ) ).toBeInTheDocument();
	} );

	// The tree's own summary checkbox was already named. This pins that the
	// row names are distinct from it, so a fix that reused one string for all
	// of them would still fail.
	it( 'gives the summary and the rows different names', async () => {
		await renderBrowser();

		const names = screen
			.getAllByRole( 'checkbox' )
			.map( box => box.getAttribute( 'aria-label' ) ?? '' );

		expect( new Set( names ).size ).toBe( names.length );
	} );
} );

describe( 'the folder toggle', () => {
	it( 'points aria-controls at the region it expands', async () => {
		await renderBrowser();

		const toggle = screen.getByRole( 'button', { name: 'Folder: wp-content' } );
		const controls = toggle.getAttribute( 'aria-controls' );

		expect( controls ).toBeTruthy();
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );

		await userEvent.click( toggle );

		// Expanded, the id must resolve — `aria-expanded` is meaningless if
		// the region it names is not in the document.
		await waitFor( () => expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' ) );
		// eslint-disable-next-line testing-library/no-node-access -- Resolving an id reference is the assertion; no query exposes it.
		expect( document.getElementById( controls as string ) ).toBeInTheDocument();
	} );
} );

describe( 'the preview pane', () => {
	it( 'is a named region that focus can enter', async () => {
		await renderBrowser();
		await userEvent.click( screen.getByRole( 'button', { name: 'File: wp-config.php' } ) );

		const preview = await screen.findByRole( 'region', { name: 'Preview of wp-config.php' } );
		expect( preview ).toHaveAttribute( 'tabindex', '0' );
	} );

	// Without this the reader has to tab through every remaining tree row to
	// reach content they just asked for, and on a scrolled tree the card
	// renders off-screen entirely.
	it( 'takes focus when a file is opened', async () => {
		await renderBrowser();
		await userEvent.click( screen.getByRole( 'button', { name: 'File: wp-config.php' } ) );

		const preview = await screen.findByRole( 'region', { name: 'Preview of wp-config.php' } );
		await waitFor( () => expect( preview ).toHaveFocus() );
	} );
} );

describe( 'folder states', () => {
	it( 'announces a folder that could not be loaded', async () => {
		mockApiFetch.mockImplementation( ( options: { data?: { path?: string } } ) => {
			if ( options.data?.path === '/wp-content' ) {
				return Promise.reject( new Error( 'nope' ) );
			}
			return Promise.resolve( { contents: ROOT } );
		} );

		await renderBrowser();
		await userEvent.click( screen.getByRole( 'button', { name: 'Folder: wp-content' } ) );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			"Couldn't load this folder."
		);
	} );

	it( 'announces an empty folder', async () => {
		mockApiFetch.mockImplementation( ( options: { data?: { path?: string } } ) => {
			if ( options.data?.path === '/wp-content' ) {
				return Promise.resolve( { contents: {} } );
			}
			return Promise.resolve( { contents: ROOT } );
		} );

		await renderBrowser();
		await userEvent.click( screen.getByRole( 'button', { name: 'Folder: wp-content' } ) );

		await expect( screen.findByRole( 'status' ) ).resolves.toHaveTextContent( 'Empty' );
	} );
} );
