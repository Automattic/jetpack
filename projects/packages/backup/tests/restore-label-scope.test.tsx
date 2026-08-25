// Download and Restore sit side by side in the detail header and look
// symmetric. They are not: a selection can narrow a download, but a
// restore point is restored whole — there is no upstream shape for
// restoring a subset of files. So the Restore action must never count
// the file selection, however the Download action beside it is labelled.

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
import userEvent from '@testing-library/user-event';
import BackupDetail from '../src/dashboard/components/backup-detail';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { BackupActivityItem } from '../src/dashboard/types/activity';

const ITEM: BackupActivityItem = {
	id: 'act-cloud',
	kind: 'backup',
	title: 'Backup complete',
	publishedAt: '2026-08-13T18:08:56+00:00',
	actor: { type: 'Application', name: 'Jetpack' },
	rewindId: '1786644531.123',
	stats: '46 plugins, 23 themes',
	isComplete: true,
};

/**
 * The single root file's own checkbox.
 *
 * Row checkboxes carry `label=""`, so they cannot be addressed by name.
 * Exclude the only named checkbox in the browser — the tree's "N items
 * selected" summary — and require exactly one to remain, rather than
 * taking one by index that could silently become the summary.
 *
 * @return The file row's checkbox.
 */
function fileRowCheckbox(): HTMLElement {
	const summary = screen.getByRole( 'checkbox', { name: /items? selected/ } );
	const rows = screen.getAllByRole( 'checkbox' ).filter( box => box !== summary );
	if ( rows.length !== 1 ) {
		throw new Error( `Expected one file row checkbox, found ${ rows.length }` );
	}
	return rows[ 0 ];
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( {
		contents: {
			'wp-config.php': { type: 'file', period: '1786644531', manifest_path: 'f5:/wp-config.php' },
		},
	} );
} );

describe( 'Restore action label', () => {
	it( 'reads "Restore to this point" with nothing selected', async () => {
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);

		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' } )
		).resolves.toBeInTheDocument();

		expect( screen.getByText( 'Restore to this point' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Download backup' ) ).toBeInTheDocument();
	} );

	// The asymmetry is the whole point, so both halves are asserted in one
	// test. Checking the Restore label alone would still pass if a future
	// change stopped labelling Download from the selection too, which would
	// be a different regression rather than this fix holding.
	it( 'stays unchanged when a file is selected, while Download counts', async () => {
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);

		await expect(
			screen.findByRole( 'button', { name: 'File: wp-config.php' } )
		).resolves.toBeInTheDocument();
		await userEvent.click( fileRowCheckbox() );

		// Download follows the selection: granular download is a real shape.
		await expect( screen.findByText( 'Download 1 selected item' ) ).resolves.toBeInTheDocument();

		// Restore does not, because granular restore is not.
		expect( screen.getByText( 'Restore to this point' ) ).toBeInTheDocument();
		expect( screen.queryByText( /Restore \d+ selected item/ ) ).not.toBeInTheDocument();
	} );
} );
