/* eslint jest/expect-expect: [ "warn", { assertFunctionNames: [ "expect", "expectIsolated", "expectBidiIsolated" ] } ] */

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import ActivityDetail from '../src/dashboard/components/activity-detail';
import ActivityList from '../src/dashboard/components/activity-list';
import BackupDetail from '../src/dashboard/components/backup-detail';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../src/dashboard/components/file-browser';
import FileInfoCard from '../src/dashboard/components/file-info-card';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import { INITIAL_VIEW } from '../src/dashboard/screens/overview';
import type { BackupActivityItem, NonBackupActivityItem } from '../src/dashboard/types/activity';
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

/** An extension in the card's previewable map, so the `<pre>` actually renders. */
const PHP_FILE: FileNodeFile = {
	name: 'functions.php',
	path: '/functions.php',
	type: 'file',
	period: '1786644531',
	manifestPath: 'f5:/functions.php',
};

const SOURCE = "<?php // Load early. return [ 'key' => 'value' ];";

// `normalizeActivityLog` fills `stats` and `summary` from the same
// `content.text`, so both fixtures below carry the one string.
const BACKUP_ITEM: BackupActivityItem = {
	id: 'act-cloud',
	kind: 'backup',
	title: 'Backup complete',
	publishedAt: '2026-08-13T18:08:56+00:00',
	actor: { type: 'Application', name: 'Jetpack' },
	rewindId: '1786644531.123',
	stats: STATS,
};

const ACTIVITY_ITEM: NonBackupActivityItem = {
	id: 'act-plugin',
	kind: 'plugin-update',
	title: 'Plugin updated',
	publishedAt: '2026-08-13T18:08:56+00:00',
	actor: { type: 'Person', name: 'Bob Sacramento' },
	summary: STATS,
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

/**
 * Assert that the element directly owning `text` is a `<bdi>`.
 *
 * No fixed `dir` can stand in: a display name's direction is per-value and
 * unknown, and `<bdi>` alone isolates it while still letting it resolve.
 *
 * @param text - The exact rendered string.
 */
function expectBidiIsolated( text: string ): void {
	expect( screen.getByText( text ).tagName ).toBe( 'BDI' );
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

	it( 'isolates the file name, size and hash on the info card', async () => {
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
		expectIsolated( '42 B', 'auto' );
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

		expectIsolated( STATS, 'auto' );
	} );

	// The right-hand pane prints this same string larger and bolder, so
	// isolating only the list leaves the louder copy reordered.
	it( 'isolates the same stats line on the backup detail pane', () => {
		// The pane mounts a file browser, which fetches its root listing on
		// mount. Nothing here reads those rows.
		mockApiFetch.mockResolvedValue( {} );

		render(
			<QueryClientProvider>
				<BackupDetail item={ BACKUP_ITEM } />
			</QueryClientProvider>
		);

		expectIsolated( STATS, 'auto' );
	} );

	it( 'isolates the summary on the non-backup detail pane', () => {
		render( <ActivityDetail item={ ACTIVITY_ITEM } /> );

		expectIsolated( STATS, 'auto' );
	} );

	it( 'isolates the file preview source', async () => {
		mockApiFetch.mockImplementation( ( options: { path: string } ) =>
			Promise.resolve(
				options.path.includes( '/file-content' )
					? { content: SOURCE, is_text: true, truncated: false }
					: { size: 42 }
			)
		);

		render(
			<QueryClientProvider>
				<FileInfoCard file={ PHP_FILE } onClose={ noop } />
			</QueryClientProvider>
		);

		await expect( screen.findByText( SOURCE ) ).resolves.toBeInTheDocument();

		expectIsolated( SOURCE, 'ltr' );
	} );
} );

// Machine data above has a direction known in advance. A person's display
// name does not, and misrenders in both directions — so it needs `<bdi>`,
// not a `dir` value.
describe( 'bidi isolation on names of unknown direction', () => {
	it( 'isolates the actor name interpolated into the backup detail sentence', () => {
		// The pane mounts a file browser, which fetches its root listing on
		// mount. Nothing here reads those rows.
		mockApiFetch.mockResolvedValue( {} );

		const { container } = render(
			<QueryClientProvider>
				<BackupDetail item={ BACKUP_ITEM } />
			</QueryClientProvider>
		);

		expectBidiIsolated( BACKUP_ITEM.actor.name );
		// Isolating the name must not cost the sentence built around it.
		expect( container ).toHaveTextContent( `by ${ BACKUP_ITEM.actor.name }` );
	} );

	it( 'isolates the actor name on the non-backup detail pane', () => {
		render( <ActivityDetail item={ ACTIVITY_ITEM } /> );

		expectBidiIsolated( ACTIVITY_ITEM.actor.name );
	} );
} );
