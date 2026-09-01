import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Text } from '@wordpress/ui';
import ActivityDetail from '../components/activity-detail';
import ActivityList, { activityQueryArgs } from '../components/activity-list';
import BackupDetail from '../components/backup-detail';
import BackupNowButton from '../components/backup-now-button';
import BackupStatusPanel, { replacesOverview } from '../components/backup-status';
import BackupStatusBanner, { BackupTroubleBanner } from '../components/backup-status/banner';
import DashboardLayout from '../components/dashboard-layout';
import NextScheduledBackup from '../components/next-scheduled-backup';
import QueryError from '../components/query-error';
import ReviewRequest from '../components/review-request';
import StorageSpace from '../components/storage-space';
import {
	ACTIVITY_LOG_DEFAULT_PER_PAGE,
	ACTIVITY_LOG_NEWEST_FIRST,
	useActivityById,
	useDefaultBackupRewindId,
	useHasRestorePoints,
} from '../hooks/use-activity-log';
import { useAnalytics } from '../hooks/use-analytics';
import { useBackups } from '../hooks/use-backups';
import { useRefreshActivityOnBackupComplete } from '../hooks/use-refresh-activity-on-backup-complete';
import { isBackupItem } from '../types/activity';
import type { ActivitySortOrder } from '../data/api/activity-log';
import type { View } from '@wordpress/dataviews';

type OverviewSearch = Record< string, unknown > & { selected?: string };

/**
 * The list's starting view state, exported so tests can pin what a reader sees first.
 */
export const INITIAL_VIEW: View = {
	type: 'list',
	page: 1,
	perPage: ACTIVITY_LOG_DEFAULT_PER_PAGE,
	filters: [],
	// Seeding `sort` is the fix for JETPACK-2298: left undefined, the cog's "Sort
	// by" select shows its first option whatever the real order, and DataViews
	// disables items-per-page until `view.sort.field` is set.
	sort: { field: 'description', direction: ACTIVITY_LOG_NEWEST_FIRST },
	titleField: 'title',
	mediaField: 'icon',
	descriptionField: 'description',
	// In DataViews' list layout, the `titleField`, `mediaField` and
	// `descriptionField` fields are rendered implicitly — anything else
	// in `fields` would render a second time as a generic row. Leave
	// `fields` empty so the title + media + description are the only
	// things shown per row.
	fields: [],
};

/**
 * Whether this page load has already recorded its view.
 *
 * See the effect below for why this is module state rather than a ref.
 */
let hasRecordedPageView = false;

/**
 * Reset the page-view latch. Test-only.
 *
 * The latch is module state precisely so it outlives an unmount, which
 * also means one test's render would otherwise silence every later one
 * in the same file.
 */
export function resetPageViewForTesting(): void {
	hasRecordedPageView = false;
}

/**
 * Overview screen for the modernized Backup dashboard.
 *
 * Renders the shared `<DashboardLayout>` chrome around a two-pane body: the
 * left pane is a paginated activity list; the right pane resolves the
 * selected row to a detail card. Selection is persisted in the URL via
 * `?selected=<id>` so a refresh preserves it; on first visit the newest
 * backup is preselected so the right pane mirrors Calypso's behaviour.
 *
 * @return The rendered Overview screen.
 */
export default function OverviewScreen() {
	// Called before any other hook here so its initialization effect runs
	// before the page-view effect below: React runs a component's effects
	// in the order the hooks were called, and an event recorded before
	// `initialize()` carries no identity.
	const { tracks } = useAnalytics();
	// Overview only, deliberately. All three routes declare
	// `"page": "jetpack-backup-dashboard"` in their `package.json`, so
	// this is one admin page whose Download and Restore views are
	// client-side transitions through `@wordpress/route` — the same shape
	// as legacy, which records one view per visit. Recording from all
	// three routes would report three views for one reader moving between
	// them, a step change at flag-flip that reads as growth and is not.
	// Landing straight on Download or Restore therefore goes uncounted,
	// which is the accepted cost of keeping the metric comparable.
	useEffect( () => {
		// The latch is module scope, not a ref. A client-side transition
		// to Download and back unmounts and remounts this screen, and a
		// per-instance guard resets with it — so a ref would record a
		// second view for the same visit, which is the over-counting this
		// whole decision exists to avoid. Module scope also subsumes the
		// StrictMode double-invocation a ref was reaching for.
		if ( hasRecordedPageView ) {
			return;
		}

		hasRecordedPageView = true;
		tracks.recordEvent( 'jetpack_backup_admin_page_view' );
	}, [ tracks ] );

	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as OverviewSearch;
	const navigate = useNavigate();
	// View state lives here so RightPane's `useActivityById` can
	// subscribe to the same paginated query the list reads from.
	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	// Same derivation `<ActivityList>` uses, so the right pane reads the cache
	// entry the list filled rather than opening its own.
	const { page, pageSize, sortOrder } = activityQueryArgs( view );
	// Subscribe to page 1 of the activity log so the right pane
	// reconciles to the newest backup the moment that page resolves.
	// Until then, `defaultSelectedId` is null and the empty-state
	// placeholder renders. Page 1 dedupes with the list's first
	// fetch when the list is on page 1 with the default per-page.
	const defaultSelectedId = useDefaultBackupRewindId();
	const selectedId = typeof search.selected === 'string' ? search.selected : defaultSelectedId;
	// `/site/rewindable-activity` only lists completed restore points, so
	// on its own it cannot tell "no backups yet" from "the first one is
	// running" from "they're all failing". This second query answers that.
	const {
		state: backupsState,
		progress,
		isInitialBackup,
		error: backupsError,
		isRefetching: backupsRefetching,
		refetch: refetchBackups,
	} = useBackups();
	// Owned here, and only here. `BackupNowButton` reads the same query
	// through its own `useBackups`, so this screen has two observers of
	// the state below — but the refresh must fire once per finished
	// backup, not once per observer. See the hook's docblock.
	useRefreshActivityOnBackupComplete( backupsState );
	// A second opinion on whether anything is restorable, from the
	// paginated activity log rather than the short `/backups` window.
	// While it is still unknown, assume there *are* restore points:
	// briefly showing the two-pane view is a milder error than briefly
	// telling an established customer they have no backups.
	//
	// A failed request is "still unknown" too, and that is the whole
	// point of reading `isError` here. React Query reports an errored
	// query as not-loading with no rows, so without this the veto lifts
	// on a question nobody managed to ask: the first-run panel takes the
	// body over and takes the activity log's own error report down with
	// it, and a 5xx reads as "your first backup is on its way".
	const {
		hasRestorePoints,
		isLoading: restorePointsLoading,
		isError: restorePointsError,
	} = useHasRestorePoints();

	const setSelected = useCallback(
		( id: string ) => {
			// Merge into existing search so future params (filters, range, etc.) aren't dropped.
			navigate( {
				search: { ...search, selected: id },
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate, search ]
	);

	if (
		replacesOverview(
			backupsState,
			isInitialBackup,
			restorePointsLoading || restorePointsError || hasRestorePoints
		)
	) {
		return (
			<DashboardLayout actions={ <BackupNowButton /> }>
				<BackupStatusPanel state={ backupsState } progress={ progress } />
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout actions={ <BackupNowButton /> }>
			{ /*
			 * A backup running on a site that already has restore points is
			 * reported alongside the list rather than in place of it. The
			 * banner is a sibling of `.jpb-overview` — not a child — because
			 * that element is a two-column grid above 960px, and a third
			 * child would be auto-placed into it.
			 */ }
			{ backupsState === 'in-progress' && <BackupStatusBanner progress={ progress } /> }
			{ /*
			 * The backup-state read failed. Reported here rather than as a
			 * takeover for the same reason as the banner: whatever the
			 * activity log managed to load is still worth showing, and this
			 * failure says nothing about it.
			 *
			 * `error` can be null on this path and that is not a bug. The
			 * route answers a WPCOM reply it cannot decode with a bare
			 * `null` body, which WordPress serves as HTTP 200 — so the
			 * request resolves, React Query records a success, and the only
			 * signal left is the derived state. That is also why the retry button
			 * matters more here than elsewhere: nothing else will ask again.
			 * The poll stops deliberately on an unreadable response rather
			 * than hammering a failing upstream.
			 */ }
			{ backupsState === 'error' && (
				<QueryError
					className="jpb-query-error--standalone"
					title={ __( "We couldn't check your site's backup status.", 'jetpack-backup-pkg' ) }
					error={ backupsError }
					onRetry={ refetchBackups }
					isRetrying={ backupsRefetching }
				/>
			) }
			{ /*
			 * The takeover panel has stood down but the site's backups are
			 * still failing, so the report moves here rather than vanishing
			 * with it. See `BackupTroubleBanner` for why those were two jobs
			 * in one predicate.
			 *
			 * Held back while the activity log is still loading. Both
			 * queries start together and `/jetpack/v4/backups` is one round
			 * trip against the activity log's paginated one, so it normally
			 * wins — and during that window the veto is still up, which puts
			 * us here. On a site that turns out to have no restore points
			 * the veto then lifts and the takeover panel replaces the body,
			 * saying the same thing the banner just said. Waiting costs
			 * nothing and avoids announcing the most alarming state in the
			 * dashboard twice in two different shapes. `isError` is not
			 * loading, so the terminal case still reports immediately.
			 */ }
			{ ! restorePointsLoading && <BackupTroubleBanner state={ backupsState } /> }
			{ /*
			 * When the next one runs, above the storage section because that is the
			 * order legacy reads in.
			 *
			 * Legacy's `COMPLETE` gate, widened to include `in-progress`: legacy takes
			 * the line down for the length of every run, where reporting both facts
			 * side by side is the call `summarizeBackups` already made.
			 *
			 * `replacesOverview` above is not enough to arrange this. Its veto is up
			 * whenever restore points are loading or errored, not only when the site
			 * has them, and it has no branch at all for `error` or `loading` — so
			 * without this gate a site with an undecodable backups read promised a next
			 * run directly under "We couldn't check your site's backup status."
			 *
			 * The component self-hides on the other half of legacy's gate.
			 */ }
			{ ( backupsState === 'complete' || backupsState === 'in-progress' ) && (
				<NextScheduledBackup />
			) }
			{ /*
			 * Above the list, and a sibling of the grid for the same
			 * reason the banners are. It answers a question the list
			 * cannot — a site whose backups have stopped because storage
			 * ran out sees only an activity log that quietly stops — so it
			 * belongs where that news is read first, not below the fold.
			 *
			 * It renders nothing until it has both a usage figure and a
			 * limit, so on a site with no retention policy this costs a
			 * pair of requests and no layout.
			 */ }
			<StorageSpace />
			{ /*
			 * Only on this path, never beside the takeover panel: the restore
			 * trigger can still fire on a site whose backups have since broken, and
			 * that reader is the wrong one to ask. Below the storage section, which
			 * a reader whose storage is full needs to read first.
			 */ }
			<ReviewRequest />
			<div className="jpb-overview">
				<ActivityList
					selectedId={ selectedId }
					onSelect={ setSelected }
					view={ view }
					onChangeView={ setView }
				/>
				<RightPane
					selectedId={ selectedId }
					page={ page }
					pageSize={ pageSize }
					sortOrder={ sortOrder }
				/>
			</div>
		</DashboardLayout>
	);
}

/**
 * Right-pane router for the Overview screen.
 *
 * Resolves the URL-driven `selectedId` to an activity item and renders the
 * matching detail card: `<BackupDetail>` for backup rows and `<ActivityDetail>`
 * for everything else. Falls back to an empty/not-found state when the
 * selection is missing or doesn't resolve.
 *
 * @param props            - Component props.
 * @param props.selectedId - Currently selected row id, or null when nothing is selected.
 * @param props.page       - The page currently shown in the list.
 * @param props.pageSize   - The per-page setting currently shown in the list.
 * @param props.sortOrder  - The sort direction currently shown in the list.
 * @return The rendered detail card or an empty-state placeholder.
 */
function RightPane( {
	selectedId,
	page,
	pageSize,
	sortOrder,
}: {
	selectedId: string | null;
	page: number;
	pageSize: number;
	sortOrder: ActivitySortOrder;
} ) {
	// All four must match the list's arguments — this reads its cache entry.
	const item = useActivityById( selectedId, page, pageSize, sortOrder );
	if ( ! selectedId ) {
		return (
			<div className="jpb-overview__detail jpb-overview__detail--empty">
				<Text>{ __( 'Select an item from the list to see details.', 'jetpack-backup-pkg' ) }</Text>
			</div>
		);
	}
	if ( ! item ) {
		return (
			<div className="jpb-overview__detail jpb-overview__detail--empty">
				<Text>{ __( 'Item not found.', 'jetpack-backup-pkg' ) }</Text>
			</div>
		);
	}
	if ( isBackupItem( item ) ) {
		// Keyed by rewindId so switching backups remounts the detail pane —
		// `BackupDetail` and `FileBrowser` hold selection/open-file state that
		// otherwise survives a prop change and leaks into the next backup.
		return <BackupDetail key={ item.rewindId } item={ item } />;
	}
	return <ActivityDetail item={ item } />;
}
