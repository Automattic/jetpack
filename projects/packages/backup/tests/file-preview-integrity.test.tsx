const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import FileInfoCard from '../src/dashboard/components/file-info-card';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { FileNodeFile } from '../src/dashboard/types/file-tree';

/** Closing is irrelevant to these assertions; the card renders regardless. */
const noop = () => {};

const FILE: FileNodeFile = {
	name: 'error.log',
	path: '/error.log',
	type: 'file',
	period: '1786644531',
	manifestPath: 'f5:/error.log',
};

const NOT_TEXT = 'This file is not text and cannot be previewed.';
const TRUNCATED = 'Preview truncated: this file is too large to show in full.';

/**
 * Answer the preview fetch with the given payload and render the card.
 *
 * @param payload - What `/rewind/backup/file-content` returns.
 */
async function renderCard( payload: Record< string, unknown > ): Promise< void > {
	mockApiFetch.mockImplementation( ( options: { path: string } ) =>
		Promise.resolve( options.path.includes( '/file-content' ) ? payload : { size: 42 } )
	);

	render(
		<QueryClientProvider>
			<FileInfoCard file={ FILE } onClose={ noop } />
		</QueryClientProvider>
	);

	await expect(
		screen.findByRole( 'heading', { name: FILE.name, level: 3 } )
	).resolves.toBeInTheDocument();
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
} );

describe( 'preview integrity', () => {
	// The bridge withholds bytes it could not read as text, because serving them
	// puts a `?` where every invalid byte was and calls it the file's contents.
	// Content is in the fixture anyway, so the verdict has to be what suppresses it.
	it( 'says a file is not text rather than showing bytes flagged unreadable', async () => {
		await renderCard( { content: 'raw ? bytes', is_text: false, truncated: false } );

		await expect( screen.findByText( NOT_TEXT ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'raw ? bytes' ) ).not.toBeInTheDocument();
	} );

	it( 'marks a preview the bridge cut short', async () => {
		await renderCard( { content: 'first 64 KB', is_text: true, truncated: true } );

		await expect( screen.findByText( TRUNCATED ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'first 64 KB' ) ).toBeInTheDocument();
	} );

	// The note has to earn its way on screen: one that always renders would pass
	// the test above and tell every reader their file was clipped.
	it( 'says nothing about truncation for a whole file', async () => {
		await renderCard( { content: 'the whole file', is_text: true, truncated: false } );

		await expect( screen.findByText( 'the whole file' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( TRUNCATED ) ).not.toBeInTheDocument();
		expect( screen.queryByText( NOT_TEXT ) ).not.toBeInTheDocument();
	} );

	// Both verdicts default to the innocent answer, so a payload without them —
	// a pending query, or a response from a site still running the old bridge —
	// previews rather than accusing the file of being binary.
	it( 'previews a payload carrying neither verdict', async () => {
		await renderCard( { content: 'define( "X", 1 );' } );

		await expect( screen.findByText( 'define( "X", 1 );' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( NOT_TEXT ) ).not.toBeInTheDocument();
		expect( screen.queryByText( TRUNCATED ) ).not.toBeInTheDocument();
	} );
} );
