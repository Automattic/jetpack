// The pane sits beside the list, so its header must match the clicked row.

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
import BackupDetail from '../src/dashboard/components/backup-detail';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { BackupActivityItem } from '../src/dashboard/types/activity';

/**
 * One backup row in the dashboard's normalized shape. `title` is what
 * `normalizeActivityLog` copies out of WPCOM's `summary`, and it is the
 * same field the activity list renders as each row's title.
 *
 * @param title - The row's title.
 * @return A backup activity item.
 */
function backupItem( title: string ): BackupActivityItem {
	return {
		id: 'act-cloud',
		kind: 'backup',
		title,
		publishedAt: '2026-08-13T18:08:56+00:00',
		actor: { type: 'Application', name: 'Jetpack' },
		rewindId: '1786644531.123',
		stats: '46 plugins, 23 themes',
		isComplete: true,
	};
}

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	// The file browser fetches the backup's root listing on mount. An
	// empty response is enough — this suite is about the header.
	mockApiFetch.mockResolvedValue( {} );
} );

describe( 'BackupDetail header', () => {
	it( "renders the item's own title", () => {
		render(
			<QueryClientProvider>
				<BackupDetail item={ backupItem( 'Initial backup complete' ) } />
			</QueryClientProvider>
		);

		expect(
			screen.getByRole( 'heading', { name: 'Initial backup complete' } )
		).toBeInTheDocument();
	} );

	// Two different rows must not head the pane with the same string.
	// A fixed header passes the assertion above by accident whenever the
	// hardcoded text happens to match one row.
	it( 'follows the selected row rather than a fixed string', () => {
		const { rerender } = render(
			<QueryClientProvider>
				<BackupDetail item={ backupItem( 'Initial backup complete' ) } />
			</QueryClientProvider>
		);

		rerender(
			<QueryClientProvider>
				<BackupDetail item={ backupItem( 'Backup complete' ) } />
			</QueryClientProvider>
		);

		expect( screen.getByRole( 'heading', { name: 'Backup complete' } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Initial backup complete' } )
		).not.toBeInTheDocument();
		expect( screen.queryByText( 'Backup and scan complete' ) ).not.toBeInTheDocument();
	} );
} );
