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

const WP_CONFIG: FileNodeFile = {
	name: 'wp-config.php',
	path: '/wp-config.php',
	type: 'file',
	period: '1786644531',
	manifestPath: 'f5:/wp-config.php',
};

const noop = () => {};

const downloadCalls = () =>
	mockApiFetch.mock.calls.filter( ( [ opts ] ) =>
		String( opts?.path ?? '' ).includes( '/file-download-url' )
	);

describe( 'Download file button', () => {
	it( 'stays hidden until a sensitive file is revealed, and asks for the link only on click', async () => {
		mockApiFetch.mockImplementation( ( options: { path: string } ) =>
			Promise.resolve(
				options.path.includes( '/file-download-url' )
					? { url: 'https://example.com/signed' }
					: { content: 'x', is_text: true, truncated: false, size: 1 }
			)
		);
		// jsdom does not implement navigation; the anchor click is the observable.
		const click = jest.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( () => {} );
		const user = userEvent.setup();
		render(
			<QueryClientProvider>
				<FileInfoCard file={ WP_CONFIG } onClose={ noop } />
			</QueryClientProvider>
		);

		expect( screen.queryByRole( 'button', { name: 'Download file' } ) ).not.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: /show preview/i } ) );
		expect( downloadCalls() ).toHaveLength( 0 );

		await user.click( await screen.findByRole( 'button', { name: 'Download file' } ) );

		await waitFor( () => expect( click ).toHaveBeenCalledTimes( 1 ) );
		expect( downloadCalls() ).toHaveLength( 1 );
		click.mockRestore();
	} );
} );
