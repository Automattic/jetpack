jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
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
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { FileNodeFile } from '../src/dashboard/types/file-tree';

const noop = () => {};

const downloadCalls = () =>
	mockApiFetch.mock.calls.filter( ( [ opts ] ) =>
		String( opts?.path ?? '' ).includes( '/file-download-url' )
	);

const fileAt = ( name: string ): FileNodeFile => ( {
	name,
	path: `/${ name }`,
	type: 'file',
	period: '1786644531',
	manifestPath: `f5:/${ name }`,
} );

/**
 * Answers the download route with a link, or a failure, and everything else with text.
 *
 * @param failDownload - Whether the download route rejects.
 */
function mockEndpoints( failDownload = false ) {
	mockApiFetch.mockImplementation( ( options: { path: string } ) => {
		if ( options.path.includes( '/file-download-url' ) ) {
			return failDownload
				? Promise.reject( new Error( 'nope' ) )
				: Promise.resolve( { url: 'https://example.com/signed' } );
		}
		return Promise.resolve( { content: 'x', is_text: true, truncated: false, size: 1 } );
	} );
}

const renderCard = ( file: FileNodeFile ) =>
	render(
		<QueryClientProvider>
			<FileInfoCard file={ file } onClose={ noop } />
		</QueryClientProvider>
	);

beforeEach( () => {
	mockApiFetch.mockReset();
} );

describe( 'Download file button', () => {
	// jsdom does not implement navigation; the anchor click is the observable.
	it.each( [
		[ 'wp-config.php', /show preview/i ],
		[ '.env', /show download/i ],
		[ 'database.sql.gz', /show download/i ],
	] )(
		'stays hidden for %s until the reader reveals it, and asks for the link only on click',
		async ( name, reveal ) => {
			mockEndpoints();
			const click = jest
				.spyOn( HTMLAnchorElement.prototype, 'click' )
				.mockImplementation( () => {} );
			const user = userEvent.setup();
			renderCard( fileAt( name ) );

			expect( screen.queryByRole( 'button', { name: 'Download file' } ) ).not.toBeInTheDocument();
			await user.click( screen.getByRole( 'button', { name: reveal } ) );
			expect( downloadCalls() ).toHaveLength( 0 );

			await user.click( await screen.findByRole( 'button', { name: 'Download file' } ) );

			await waitFor( () => expect( click ).toHaveBeenCalledTimes( 1 ) );
			expect( downloadCalls() ).toHaveLength( 1 );
			click.mockRestore();
		}
	);

	it( 'announces a failed download', async () => {
		mockEndpoints( true );
		const user = userEvent.setup();
		renderCard( fileAt( 'readme.txt' ) );

		await user.click( await screen.findByRole( 'button', { name: 'Download file' } ) );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'The download could not start'
		);
	} );
} );
