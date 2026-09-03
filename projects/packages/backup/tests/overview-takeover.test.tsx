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
import { onlineManager } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { stage as OverviewStage } from '../routes/dashboard/stage';
import { keys, queryClient } from '../src/dashboard/data/query-client';

const CONNECTED = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

// Testing Library's default `findBy` window is one second. These stages
// render behind several sequential requests, and a loaded CI runner under
// coverage has taken well over that for the same work locally-green here.
const SETTLE = { timeout: 10000 };

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
 * @param options               - Overrides.
 * @param options.backups       - What `/jetpack/v4/backups` resolves with. `null` is the
 *                              shape a non-200 from WPCOM actually takes — the legacy
 *                              route returns a bare `null`, which WordPress serves as
 *                              HTTP 200, so the request resolves rather than rejecting.
 * @param options.activity      - Rewindable-activity entries.
 * @param options.activityFails - Make `/site/rewindable-activity` reject.
 */
function mockEndpoints( {
	backups = [] as unknown[] | null,
	activity = [] as unknown[],
	activityFails = false,
} = {} ) {
	mockApiFetch.mockImplementation( ( o: { path?: string } ) => {
		const path = o?.path ?? '';
		if ( path.includes( '/site/capabilities' ) ) {
			return Promise.resolve( { hasBackupPlan: true, hasScan: false } );
		}
		if ( path.includes( '/site/rewindable-activity' ) ) {
			return activityFails
				? Promise.reject( new Error( 'Could not fetch the activity log.' ) )
				: Promise.resolve( {
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

afterEach( () => {
	// `onlineManager` is a module singleton, so an offline test leaves every
	// later one in this file parking its requests.
	onlineManager.setOnline( true );
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

	// JETPACK-2491 — `networkMode: 'online'` parks the activity read for an
	// offline browser rather than failing it, so it is neither loading nor
	// errored and holds no rows. The veto lifted on a question nobody asked,
	// and an established site was told its first backup was on its way.
	it( 'does not take over when the activity request was parked, not answered', async () => {
		mockEndpoints( { backups: [] } );
		// Warmed so the gate and the backup state both have an answer, leaving
		// the activity log as the only read the offline browser parks.
		queryClient.setQueryData( keys.capabilities(), { hasBackupPlan: true, hasScan: false } );
		queryClient.setQueryData( keys.backups(), [] );
		onlineManager.setOnline( false );

		render( <OverviewStage /> );

		// The header renders above the body either way, so waiting on it
		// settles the render without deciding what this test asserts.
		await expect(
			screen.findByRole( 'button', { name: 'Back up now' } )
		).resolves.toBeInTheDocument();

		expect(
			screen.queryByText( 'Your first cloud backup will be ready soon' )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'group', { name: 'Backup activity' } ) ).toBeInTheDocument();
	} );

	it( 'still takes over when the activity log holds no backup rows', async () => {
		// A site with activity but no restore points — e.g. only post edits.
		mockEndpoints( { backups: [ UNUSABLE_BACKUP ], activity: [ activityEntry( 'posts' ) ] } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We're having trouble backing up your site" )
		).resolves.toBeInTheDocument();
	} );

	// The cell where the first-run panel and the activity-log error
	// boundary were each individually right and jointly blind. An errored
	// query is neither loading nor holding rows, so `hasRestorePoints`
	// came back false with `isLoading` false — the veto lifted, the panel
	// took the body over, and the error `<ActivityList>` was about to
	// render went down with it. A failed request read as "your first
	// backup is on its way".
	it( 'does not take over when the activity request failed', async () => {
		mockEndpoints( { backups: [], activityFails: true } );

		render( <OverviewStage /> );

		// The activity log says what went wrong...
		await expect(
			screen.findByText( "We couldn't load your site's activity.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
		// ...instead of the panel claiming a first backup is coming.
		expect(
			screen.queryByText( 'Your first cloud backup will be ready soon' )
		).not.toBeInTheDocument();
	} );
} );

// Suppressing the takeover must not also suppress the *message*. Only the
// panel carried "your backups are failing" and its support link, so every
// case where the panel correctly stands down used to drop that too — which
// the veto widening above would have made worse, not better.
describe( 'Failing backups with the takeover suppressed', () => {
	it( 'still reports the failure when restore points are listed', async () => {
		mockEndpoints( { backups: [ UNUSABLE_BACKUP ], activity: [ activityEntry( 'cloud' ) ] } );

		render( <OverviewStage /> );

		// The list is kept...
		await expect(
			screen.findByText( 'Backup complete', undefined, SETTLE )
		).resolves.toBeInTheDocument();
		// ...and the reader is told anyway, with a way to get help.
		expect( screen.getByText( "We're having trouble backing up your site." ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Get in touch with us/ } ) ).toBeInTheDocument();
	} );

	it( 'still reports the failure when the activity request failed', async () => {
		mockEndpoints( { backups: [ UNUSABLE_BACKUP ], activityFails: true } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We're having trouble backing up your site.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
	} );
} );

describe( 'Backup-state read failure', () => {
	// `/jetpack/v4/backups` answers a non-200 from WPCOM with a bare
	// `null` body, which WordPress serves as HTTP 200 — so the request
	// *resolves*, React Query records a success, and neither `error` nor
	// a retry ever fires. The state was computed and documented
	// ("we couldn't ask" must never be rendered as "you have none") and
	// then rendered nowhere at all.
	it( 'reports a null backups response instead of staying silent', async () => {
		mockEndpoints( { backups: null, activity: [ activityEntry( 'cloud' ) ] } );

		render( <OverviewStage /> );

		await expect(
			screen.findByText( "We couldn't check your site's backup status.", undefined, SETTLE )
		).resolves.toBeInTheDocument();
	} );

	it( 'leaves the activity list usable while the backup state is unreadable', async () => {
		mockEndpoints( { backups: null, activity: [ activityEntry( 'cloud' ) ] } );

		render( <OverviewStage /> );

		// The notice is a report, not a takeover: the restore points the
		// reader came for are still listed beside it. Both halves are
		// asserted — the row alone renders on trunk too, so without the
		// notice assertion this test would pass with the fix reverted.
		await expect(
			screen.findByText( 'Backup complete', undefined, SETTLE )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByText( "We couldn't check your site's backup status." )
		).toBeInTheDocument();
	} );
} );
