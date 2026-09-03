// React Query parks a request for an offline browser rather than failing it,
// so the read is neither loading nor errored and holds no rows. The file
// browser read that as an answer: an empty tree for the backup, and "Empty"
// spoken aloud for a folder nobody managed to look inside.

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { onlineManager } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import { keys, queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';

const REWIND_ID = '1786644531.123';

/** Selection is irrelevant to these assertions; the rows render regardless. */
const noop = () => {};

const ROOT = {
	'wp-content': { type: 'dir', has_children: true },
	'wp-config.php': { type: 'file', period: '1786644531', manifest_path: 'f5:/wp-config.php' },
};

const WP_CONTENT = {
	'style.css': { type: 'file', period: '1786644531', manifest_path: 'f5:/wp-content/style.css' },
};

/**
 * Render the browser.
 */
function renderBrowser(): void {
	render(
		<QueryClientProvider>
			<FileBrowser
				rewindId={ REWIND_ID }
				selection={ EMPTY_FILE_SELECTION }
				onSelectionChange={ noop }
			/>
		</QueryClientProvider>
	);
}

/**
 * Let the parked state reach the observer. It arrives a tick after the
 * invalidation settles, so asserting straight away passes without looking.
 *
 * @return Promise resolving once the tick has elapsed.
 */
async function settle(): Promise< void > {
	await act( async () => {
		await new Promise( resolve => setTimeout( resolve, 50 ) );
	} );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( options: { data?: { path?: string } } ) =>
		Promise.resolve( { contents: options.data?.path === '/wp-content' ? WP_CONTENT : ROOT } )
	);
} );

afterEach( () => {
	// `onlineManager` is a module singleton, so an offline test leaves every
	// later one in this file parking its requests.
	onlineManager.setOnline( true );
} );

describe( 'the root tree', () => {
	it( 'keeps waiting when the root read was parked, not answered', async () => {
		onlineManager.setOnline( false );

		renderBrowser();
		await settle();

		// The selection header renders above the tree either way, so reading it
		// proves the browser mounted without deciding what this test asserts.
		expect( screen.getByRole( 'checkbox', { name: '0 items selected' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'presentation' ) ).toBeInTheDocument();
	} );

	// The other half: a parked *refetch* still holds its rows, so reporting it
	// as unanswered would blank a tree that is on screen and working.
	it( 'keeps its rows when a refetch parks on a loaded tree', async () => {
		renderBrowser();
		await expect(
			screen.findByRole( 'button', { name: 'Folder: wp-content' } )
		).resolves.toBeInTheDocument();

		onlineManager.setOnline( false );
		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: keys.fileTree( REWIND_ID, '/' ) } );
		} );
		await settle();

		expect( screen.getByRole( 'button', { name: 'Folder: wp-content' } ) ).toBeInTheDocument();
	} );
} );

describe( 'an expanded folder', () => {
	it( 'does not announce a folder empty when its read was parked', async () => {
		renderBrowser();
		const toggle = await screen.findByRole( 'button', { name: 'Folder: wp-content' } );

		onlineManager.setOnline( false );
		await userEvent.click( toggle );
		await settle();

		// `role="status"` is a live region: whatever it holds is spoken as fact.
		await expect( screen.findByRole( 'status' ) ).resolves.toBeEmptyDOMElement();
	} );

	it( 'keeps its children when a refetch parks on a loaded folder', async () => {
		renderBrowser();
		await userEvent.click( await screen.findByRole( 'button', { name: 'Folder: wp-content' } ) );
		await expect(
			screen.findByRole( 'button', { name: 'File: style.css' } )
		).resolves.toBeInTheDocument();

		onlineManager.setOnline( false );
		await act( async () => {
			await queryClient.invalidateQueries( {
				queryKey: keys.fileTree( REWIND_ID, '/wp-content' ),
			} );
		} );
		await settle();

		expect( screen.getByRole( 'button', { name: 'File: style.css' } ) ).toBeInTheDocument();
	} );
} );
