// When the first-run panel is allowed to replace the Overview body.
//
// `replacesOverview` is unit-tested directly; this covers the wiring in
// `overview.tsx` that feeds it, because the two inputs come from two
// different endpoints and getting the combination wrong fails silently
// in both directions — either the panel never appears, or it appears
// over a list that still had restore points in it.

const mockApiFetch = jest.fn();
const mockSearch = jest.fn< Record< string, unknown >, [] >();
const mockNavigate = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch(),
	useNavigate: () => mockNavigate,
	useParams: () => ( { rewindId: '1777035492' } ),
	Link: ( { children, ...rest }: { children: React.ReactNode } ) => <a { ...rest }>{ children }</a>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row — which only happens here because
// these are the first tests to render the list with a row in it.
jest.spyOn( window.HTMLElement.prototype, 'scrollIntoView' ).mockImplementation();

/**
 * One rewindable-activity entry, in WPCOM's shape.
 *
 * @param gridicon - `cloud` marks a backup row; anything else does not.
 * @return A raw activity entry.
 */
function activityEntry( gridicon: string ) {
	return {
		activity_id: `act-${ gridicon }`,
		gridicon,
		summary: 'Backup complete',
		published: '2026-08-13T18:08:56+00:00',
		rewind_id: '1786644531.123',
		actor: { type: 'Application', name: 'Jetpack' },
		content: { text: '46 plugins, 23 themes' },
		name: 'rewind__backup_complete_full',
	};
}

/**
 * Answer every endpoint the Overview reads.
 *
 * @param options          - Overrides.
 * @param options.backups  - What `/jetpack/v4/backups` returns.
 * @param options.activity - Rewindable-activity entries.
 */
function mockEndpoints( { backups = [] as unknown[], activity = [] as unknown[] } = {} ) {
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return Promise.resolve( {
				current: { orderedItems: activity },
				totalItems: activity.length,
				totalPages: 1,
			} );
		}
		if ( path.includes( '/site/backup/size' ) ) {
			return Promise.resolve( { ok: true, backups_stopped: false } );
		}
		if ( path === '/jetpack/v4/backups' ) {
			return Promise.resolve( backups );
		}
		return Promise.resolve( {} );
	} );
}

/** A finished-but-discarded backup: present, but not a usable restore point. */
const UNUSABLE_BACKUP = {
	id: '1',
	started: '2026-08-13 18:08:56',
	last_updated: '2026-08-13 18:54:14',
	status: 'finished',
	period: '1786644531',
	percent: '100',
	is_backup: '1',
	is_scan: '0',
	discarded: '1',
	stats: { prefix: 'wp_' },
};

beforeEach( () => {
	queryClient.clear();
	queryClient.setDefaultOptions( { queries: { retry: false } } );

	mockApiFetch.mockReset();
	mockSearch.mockReset();
	mockSearch.mockReturnValue( {} );
	mockNavigate.mockReset();

	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: CONNECTED,
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'Overview takeover', () => {
	it( 'replaces the body on a genuinely empty site', async () => {
		mockEndpoints( { backups: [], activity: [] } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( 'Your first cloud backup will be ready soon' )
		).resolves.toBeInTheDocument();
	} );

	// The regression the takeover could otherwise cause. `/jetpack/v4/backups`
	// reports only VaultPress's most recent handful of rows, so a run of
	// recent failures reads as "no good backups" even while older restore
	// points are still listed — and hiding the list there would land at the
	// exact moment someone came to restore one.
	it( 'keeps the list when the activity log still has a restore point', async () => {
		mockEndpoints( { backups: [ UNUSABLE_BACKUP ], activity: [ activityEntry( 'cloud' ) ] } );

		render( <OverviewStage /> );

		// The list renders its backup row...
		await expect( screen.findByText( 'Backup complete' ) ).resolves.toBeInTheDocument();
		// ...and the takeover panel stays away.
		expect(
			screen.queryByText( "We're having trouble backing up your site" )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Your first cloud backup will be ready soon' )
		).not.toBeInTheDocument();
	} );

	it( 'still takes over when the activity log holds no backup rows', async () => {
		// A site with activity but no restore points — e.g. only post edits.
		mockEndpoints( { backups: [ UNUSABLE_BACKUP ], activity: [ activityEntry( 'posts' ) ] } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We're having trouble backing up your site" )
		).resolves.toBeInTheDocument();
	} );
} );
