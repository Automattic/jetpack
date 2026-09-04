const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

// Imports must come after the jest.mock factory above.
import { render, screen } from '@testing-library/react';
import ActivityList from '../src/dashboard/components/activity-list';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import FileInfoCard from '../src/dashboard/components/file-info-card';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import { INITIAL_VIEW } from '../src/dashboard/screens/overview';
import type { FileNodeFile } from '../src/dashboard/types/file-tree';

/** Neither closing nor selection is relevant here; everything renders regardless. */
const noop = () => {};

const HASH = 'd41d8cd98f00b204e9800998ecf8427e';
const STATS = '47 plugins, 23 themes, 2138 uploads, 104 posts, 18 pages';

const FILE: FileNodeFile = {
	name: '..htaccess.swp',
	path: '/..htaccess.swp',
	type: 'file',
	period: '1786644531',
	manifestPath: 'f5:/..htaccess.swp',
};

/**
 * Assert that the element directly owning `text` carries its own `dir`.
 *
 * Reading `dir` off the text's own node is what stops the assertion passing
 * on one an ancestor happens to set, which isolates nothing on its own.
 *
 * @param text     - The exact rendered string.
 * @param expected - The `dir` value the node must carry.
 */
function expectIsolated( text: string, expected: 'ltr' | 'auto' ): void {
	expect( screen.getByText( text ) ).toHaveAttribute( 'dir', expected );
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
	window.JP_CONNECTION_INITIAL_STATE = {
		connectionStatus: { isRegistered: true, hasConnectedOwner: true, isUserConnected: true },
	} as unknown as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'bidi isolation on LTR data', () => {
	it( 'isolates folder and file names in the browser tree', async () => {
		mockApiFetch.mockResolvedValue( {
			contents: {
				'.git': { type: 'dir', has_children: true },
				'.htaccess': { type: 'file', period: '1786644531' },
			},
		} );

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
			screen.findByRole( 'button', { name: 'Folder: .git' } )
		).resolves.toBeInTheDocument();

		expectIsolated( '.git', 'ltr' );
		expectIsolated( '.htaccess', 'ltr' );
	} );

	it( 'isolates the file name and hash on the info card', async () => {
		mockApiFetch.mockImplementation( ( options: { path: string } ) =>
			Promise.resolve(
				options.path.includes( '/file-content' )
					? { content: 'swap file', is_text: true, truncated: false }
					: { size: 42, hash: HASH }
			)
		);

		render(
			<QueryClientProvider>
				<FileInfoCard file={ FILE } onClose={ noop } />
			</QueryClientProvider>
		);

		await expect( screen.findByText( HASH ) ).resolves.toBeInTheDocument();

		expectIsolated( FILE.name, 'ltr' );
		expectIsolated( HASH, 'ltr' );
	} );

	it( 'isolates the activity stats line', async () => {
		mockApiFetch.mockResolvedValue( {
			current: {
				orderedItems: [
					{
						activity_id: 'a1',
						name: 'rewind__backup_complete_full',
						gridicon: 'cloud',
						rewind_id: '1786600000',
						published: '2026-08-20T10:00:00+00:00',
						summary: 'Backup complete',
						content: { text: STATS },
						is_rewindable: true,
					},
				],
			},
			totalItems: 1,
			totalPages: 1,
		} );

		render(
			<QueryClientProvider>
				<ActivityList
					selectedId={ null }
					onSelect={ noop }
					view={ INITIAL_VIEW }
					onChangeView={ noop }
				/>
			</QueryClientProvider>
		);

		await expect( screen.findByText( STATS ) ).resolves.toBeInTheDocument();

		// `auto`, not `ltr`: WPCOM translates this string and may return it in RTL.
		expectIsolated( STATS, 'auto' );
	} );
} );
