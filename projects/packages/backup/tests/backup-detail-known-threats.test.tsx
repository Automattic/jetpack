const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
	useParams: () => ( {} ),
	Link: ( {
		children,
		to,
		search,
		...rest
	}: {
		children: React.ReactNode;
		to: string;
		search?: Record< string, string >;
	} ) => (
		<a href={ search ? `${ to }?${ new URLSearchParams( search ).toString() }` : to } { ...rest }>
			{ children }
		</a>
	),
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackupDetail from '../src/dashboard/components/backup-detail';
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
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );
	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/rewind/backups/known-threats' ) ) {
			return Promise.resolve( {
				backups: [ { period: 1792244301, known_threats: SUMMARY } ],
				latest_without_known_threats: 1792200000,
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
	it( 'keeps Restore off until the threats are acknowledged, then pre-ticks the restore screen', async () => {
		const user = userEvent.setup();
		render(
			<QueryClientProvider>
				<BackupDetail item={ ITEM } />
			</QueryClientProvider>
		);

		const checkbox = await screen.findByRole( 'checkbox', {
			name: 'I understand this backup contains known threats and want to restore it anyway.',
		} );
		expect( screen.getByRole( 'button', { name: /Restore to this point/ } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'link', { name: 'Restore this backup instead' } ) ).toHaveAttribute(
			'href',
			'/restore/1792200000'
		);

		await user.click( checkbox );

		expect( screen.getByRole( 'link', { name: /Restore to this point/ } ) ).toHaveAttribute(
			'href',
			'/restore/1792244435.274?acknowledged=true'
		);
	} );
} );
