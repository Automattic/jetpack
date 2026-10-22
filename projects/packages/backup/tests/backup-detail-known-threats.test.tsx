const mockApiFetch = jest.fn();
const mockSpeak = jest.fn();

jest.mock( '@wordpress/a11y', () => ( {
	speak: ( ...args: unknown[] ) => mockSpeak( ...args ),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
	useParams: () => ( {} ),
	Link: jest.requireActual( 'react' ).forwardRef(
		(
			{
				children,
				to,
				state,
				...rest
			}: {
				children: React.ReactNode;
				to: string;
				state?: Record< string, unknown >;
			},
			ref: React.Ref< HTMLAnchorElement >
		) => (
			<a
				ref={ ref }
				href={ to }
				data-state={ state ? JSON.stringify( state ) : undefined }
				{ ...rest }
			>
				{ children }
			</a>
		)
	),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackupDetail from '../src/dashboard/components/backup-detail';
import { resetAnnouncerForTesting } from '../src/dashboard/data/announce';
import { formatDateTime } from '../src/dashboard/data/date-format';
import { queryClient } from '../src/dashboard/data/query-client';
import QueryClientProvider from '../src/dashboard/providers/query-client-provider';
import type { BackupActivityItem } from '../src/dashboard/types/activity';

const ITEM: BackupActivityItem = {
	id: 'act-flagged',
	kind: 'backup',
	title: 'Backup complete',
	publishedAt: '2026-10-17T13:40:35+00:00',
	actor: { type: 'Application', name: 'Jetpack' },
	rewindId: '1792244435.274',
	stats: '42 plugins, 5 themes',
	isComplete: true,
} as BackupActivityItem;

const SUMMARY = { malware: 3, database: 0, vulnerable: 1, ignored: 0, flagged: 3, fixed: 3 };

beforeEach( () => {
	resetAnnouncerForTesting();
	mockSpeak.mockReset();
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
	window.JPBACKUP_DASHBOARD_STATE = { knownThreatsAvailable: true };
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/rewind/backups/known-threats' ) ) {
			return Promise.resolve( {
				backups: [ { period: 1792244301, known_threats: SUMMARY } ],
				latest_without_known_threats: 1792200000,
				latest_without_known_threats_rewind_id: path.includes( 'with_clean_rewind_id=true' )
					? '1792200135.5'
					: null,
			} );
		}
		if ( path.includes( '/threats' ) ) {
			return Promise.resolve( {
				backup_id: '1792244301',
				cutoff: '2026-10-17 13:45:00',
				summary: SUMMARY,
				threats: [ { id: 1, state: 'fixed', kind: 'malware', signature: 'EICAR_AV_Test' } ],
				count: 1,
				truncated: false,
			} );
		}
		if ( path.includes( '/rewind/backup/ls' ) ) {
			return Promise.resolve( { contents: {} } );
		}
		return Promise.resolve( {} );
	} );
} );

describe( 'Backup detail for a backup with known threats', () => {
	it( 'keeps Restore off until the threats are acknowledged, then opens the restore screen acknowledged', async () => {
		const user = userEvent.setup();
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);

		const checkbox = await screen.findByRole( 'checkbox', {
			name: 'I understand this backup contains known threats and want to restore it anyway.',
		} );
		// Announced when it appears, as on WordPress.com.
		await waitFor( () =>
			expect( mockSpeak ).toHaveBeenCalledWith(
				'This backup is known to contain 3 security threats. Restoring it may bring malware back to your site.',
				'polite'
			)
		);
		const restore = screen.getByRole( 'button', { name: /Restore to this point/ } );
		expect( restore ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( restore ).toHaveAccessibleDescription(
			'To restore this backup, confirm that you understand it contains known threats.'
		);

		const toggle = screen.getByRole( 'button', { name: 'Show threats' } );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		// The clean-backup link sits below the threats toggle.
		const restoreInstead = screen.getByRole( 'link', {
			name: `Restore ${ formatDateTime( new Date( 1792200135.5 * 1000 ) ) } backup instead`,
		} );
		expect( toggle.compareDocumentPosition( restoreInstead ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		await user.click( toggle );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( screen.getByRole( 'list', { name: 'Known threats in this backup' } ) ).toBeVisible();
		expect( restoreInstead ).toHaveAttribute( 'href', '/restore/1792200135.5' );
		expect( restoreInstead ).toHaveAccessibleDescription(
			"It's the most recent backup with no known security threats."
		);

		await user.click( checkbox );

		// Focus stays on the checkbox, and screen readers hear where the restore now is.
		expect( checkbox ).toHaveFocus();
		await waitFor( () =>
			expect( mockSpeak ).toHaveBeenCalledWith(
				'You can now restore this backup with "Restore to this point", at the top of this panel.',
				'polite'
			)
		);

		const restoreLink = screen.getByRole( 'link', { name: /Restore to this point/ } );
		expect( restoreLink ).toHaveAttribute( 'href', '/restore/1792244435.274' );
		expect( restoreLink ).toHaveAttribute(
			'data-state',
			JSON.stringify( { jpbKnownThreatsAcknowledged: '1792244435.274' } )
		);
	} );

	it( 'checks a backup older than the newest 100 on its own', async () => {
		render(
			<QueryClientProvider>
				<BackupDetail item={ { ...ITEM, rewindId: '1790000000.1' } } />
			</QueryClientProvider>
		);

		await expect(
			screen.findByRole( 'checkbox', {
				name: 'I understand this backup contains known threats and want to restore it anyway.',
			} )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( '/1790000000.1/threats' ) } )
		);
	} );
} );
