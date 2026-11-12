import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Button, Spinner, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import ActivityDetail from '../components/activity-detail';
import ActivityList, { activityQueryArgs } from '../components/activity-list';
import BackupDetail from '../components/backup-detail';
import BackupNowButton from '../components/backup-now-button';
import BackupStatusPanel, { replacesOverview } from '../components/backup-status';
import BackupStatusBanner, {
	BackupCompleteBanner,
	BackupFailedRunBanner,
	BackupTroubleBanner,
	BackupWarningsBanner,
} from '../components/backup-status/banner';
import DashboardLayout from '../components/dashboard-layout';
import NextScheduledBackup from '../components/next-scheduled-backup';
import QueryError from '../components/query-error';
import StorageSpace, { StorageNotice } from '../components/storage-space';
import { isRestoreRowId } from '../data/normalize/restores';
import {
	ACTIVITY_LOG_DEFAULT_PER_PAGE,
	ACTIVITY_LOG_NEWEST_FIRST,
	useActivityById,
	useActivityLog,
	useDefaultBackupRewindId,
	useHasRestorePoints,
} from '../hooks/use-activity-log';
import { useAnalytics } from '../hooks/use-analytics';
import { failedAttemptReference, isUsableBackup, useBackups } from '../hooks/use-backups';
import { useBackupRequested } from '../hooks/use-enqueue-backup';
import { useRefreshActivityOnBackupComplete } from '../hooks/use-refresh-activity-on-backup-complete';
import { useRevealDetail } from '../hooks/use-reveal-detail';
import { isBackupItem } from '../types/activity';
import { isValidRewindId } from '../types/rewind-id';
import { overviewState } from './overview-state';
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
	// The title, media and description fields render implicitly; only fields listed here
	// describe the row's button to screen readers, so the known-threats badge goes here.
	fields: [ 'knownThreats' ],
};

/**
 * Overview screen for the modernized Backup dashboard.
 *
 * Records the page view and mounts `<DashboardLayout>` around a body that lives below
 * `<Gates>` — the view is recorded above the gate, so a plan-less visit still counts.
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
		if ( overviewState.hasRecordedPageView ) {
			return;
		}

		overviewState.hasRecordedPageView = true;
		tracks.recordEvent( 'jetpack_backup_admin_page_view' );
	}, [ tracks ] );

	return (
		<DashboardLayout actions={ <BackupNowButton /> }>
			<OverviewBody />
		</DashboardLayout>
	);
}

/**
 * The Overview's body: a paginated activity list beside a detail pane for the row
 * selected by `?selected=<id>`, defaulting to the newest backup.
 *
 * Mounted by `<Gates>`, not rendered above it: React runs a component's hooks before its
 * children, so reads moved up into the screen would fetch — and poll — behind the upsell.
 *
 * @return The rendered body.
 */
function OverviewBody() {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as OverviewSearch;
	const navigate = useNavigate();
	// View state lives here so RightPane's `useActivityById` can
	// subscribe to the same paginated query the list reads from.
	const [ view, setView ] = useState< View >( overviewState.lastView ?? INITIAL_VIEW );
	// Written on the way through, because the return trip has nothing to read it from:
	// the back links on Download and Restore carry no search.
	const rememberView = useCallback( ( next: View ) => {
		overviewState.lastView = next;
		setView( next );
	}, [] );
	// Same derivation `<ActivityList>` uses, so the right pane reads the cache
	// entry the list filled rather than opening its own.
	const { page, pageSize, sortOrder } = activityQueryArgs( view );
	// Subscribe to page 1 of the activity log so the right pane
	// reconciles to the newest backup the moment that page resolves.
	// Until then, `defaultSelectedId` is null and the empty-state
	// placeholder renders. Page 1 dedupes with the list's first
	// fetch when the list is on page 1 with the default per-page.
	const defaultSelectedId = useDefaultBackupRewindId();
	const urlSelectedId = typeof search.selected === 'string' ? search.selected : null;
	// The remembered row stands in for a missing one only on mount, which is the return trip
	// from Download or Restore. Back to the entry that had none means the newest backup again.
	const [ returnTripId, setReturnTripId ] = useState( () =>
		urlSelectedId ? null : overviewState.lastSelectedId
	);
	const selectedId = urlSelectedId ?? returnTripId ?? defaultSelectedId;
	// Only an explicit choice is remembered: `defaultSelectedId` moves as new backups
	// land, and pinning the row it happened to name would outlive its own reason.
	useEffect( () => {
		overviewState.lastSelectedId = urlSelectedId ?? returnTripId;
	}, [ urlSelectedId, returnTripId ] );
	// Puts the remembered row in the address, so `clearSelected` below always has a real
	// change to make: without one, TanStack treats its navigate as a no-op and pushes no
	// history entry, leaving Back with nowhere on the Overview to land. `replace`: this is
	// not its own stop.
	useEffect( () => {
		if ( urlSelectedId ) {
			setReturnTripId( null );
			return;
		}
		if ( returnTripId ) {
			navigate( {
				search: ( previous: OverviewSearch ) => ( { ...previous, selected: returnTripId } ),
				replace: true,
			} as Parameters< typeof navigate >[ 0 ] );
		}
	}, [ urlSelectedId, returnTripId, navigate ] );
	// `/site/rewindable-activity` only lists completed restore points, so
	// on its own it cannot tell "no backups yet" from "the first one is
	// running" from "they're all failing". This second query answers that.
	const {
		state: backupsState,
		backups,
		progress,
		isInitialBackup,
		hasWarnings,
		error: backupsError,
		isRefetching: backupsRefetching,
		refetch: refetchBackups,
	} = useBackups();
	const isBackupRequested = useBackupRequested();
	// Owned here, and only here. `BackupNowButton` reads the same query
	// through its own `useBackups`, so this screen has two observers of
	// the state below — but the refresh must fire once per finished
	// backup, not once per observer. See the hook's docblock.
	const { finishedRuns, failedRun, completedRun, isAwaitingRow, dismissCompletedRun } =
		useRefreshActivityOnBackupComplete(
			backupsState,
			isBackupRequested,
			backups.find( isUsableBackup )?.id ?? null,
			backups[ 0 ] ?? null,
			defaultSelectedId
		);
	// A second opinion on whether anything is restorable, from the
	// paginated activity log rather than the short `/backups` window.
	// While it is still unknown, assume there *are* restore points:
	// briefly showing the two-pane view is a milder error than briefly
	// telling an established customer they have no backups.
	//
	// A failed request is "still unknown" too, and so is one React Query
	// parked because the browser is offline — that is what `isError` and
	// `isPaused` are for: neither loads nor has rows, so without them the veto lifts
	// on a question nobody managed to ask: the first-run panel takes the
	// body over and takes the activity log's own error report down with
	// it, and a 5xx reads as "your first backup is on its way".
	const {
		hasRestorePoints,
		isLoading: restorePointsLoading,
		isError: restorePointsError,
		isPaused: restorePointsPaused,
	} = useHasRestorePoints();

	// The list reads the same cache entry. Only a log that never answered has no list to keep.
	const activity = useActivityLog( { page, pageSize, sortOrder } );
	const activityFailed = activity.error !== null && activity.totalPages === null;

	const overviewRef = useRef< HTMLDivElement >( null );
	const revealDetail = useRevealDetail( overviewRef, selectedId );
	const storageRef = useRef< HTMLElement >( null );

	// The updater form, like `clearSelected` below: an object literal replaces the
	// search wholesale, so every future param would depend on this closure being fresh.
	const setSelected = useCallback(
		( id: string ) => {
			revealDetail( id );
			navigate( {
				search: ( previous: OverviewSearch ) => ( { ...previous, selected: id } ),
			} as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate, revealDetail ]
	);

	// The stale id lives in the URL, so the dead end survives a reload without this.
	// A new history entry, not a replacement: the selection may be fine, so Back must restore it.
	const clearSelected = useCallback( () => {
		overviewRef.current?.focus();
		navigate( {
			search: ( previous: OverviewSearch ) => {
				const next = { ...previous };
				delete next.selected;
				return next;
			},
			// A single assertion, not `as unknown as`: the updater form stays
			// comparable, so a typo in the key is still a build error.
		} as Parameters< typeof navigate >[ 0 ] );
	}, [ navigate ] );

	if (
		replacesOverview(
			backupsState,
			isInitialBackup,
			restorePointsLoading || restorePointsError || restorePointsPaused || hasRestorePoints
		)
	) {
		return (
			<BackupStatusPanel
				state={ backupsState }
				progress={ progress }
				isStarting={ isBackupRequested && backupsState !== 'in-progress' }
				reference={ failedAttemptReference( backups ) }
			/>
		);
	}

	return (
		<>
			<StorageNotice returnFocusTo={ storageRef } />
			{ /*
			 * A backup running on a site that already has restore points is
			 * reported alongside the list rather than in place of it. The
			 * banner is a sibling of `.jpb-overview` — not a child — because
			 * that element is a two-column grid above 960px, and a third
			 * child would be auto-placed into it.
			 */ }
			{ ( backupsState === 'in-progress' || isBackupRequested ) && (
				<BackupStatusBanner progress={ backupsState === 'in-progress' ? progress : undefined } />
			) }
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
					returnFocusTo={ overviewRef }
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
			{ ! restorePointsLoading && (
				<BackupTroubleBanner
					state={ backupsState }
					reference={ failedAttemptReference( backups ) }
				/>
			) }
			{ backupsState === 'complete' && hasWarnings && <BackupWarningsBanner /> }
			{ backupsState === 'complete' && completedRun && ! hasWarnings && ! failedRun && (
				<BackupCompleteBanner
					onDismiss={ dismissCompletedRun }
					isListing={ isAwaitingRow }
					returnFocusTo={ overviewRef }
				/>
			) }
			{ backupsState === 'complete' && failedRun && (
				<BackupFailedRunBanner willRetry={ failedRun === 'will-retry' } />
			) }
			{ /*
			 * The storage row, with the next scheduled backup at its end. The gate stops an
			 * errored or loading backups read promising a next run under "We couldn't check
			 * your site's backup status."
			 */ }
			<StorageSpace
				ref={ storageRef }
				trailing={
					( backupsState === 'complete' || backupsState === 'in-progress' ) && (
						<NextScheduledBackup />
					)
				}
			/>
			{ /*
			 * Where focus goes once the empty state or either error unmounts,
			 * so the next Tab reaches the list rather than the top of the page.
			 */ }
			<div
				className={ `jpb-overview${ activityFailed ? ' jpb-overview--failed' : '' }` }
				ref={ overviewRef }
				tabIndex={ -1 }
				role="group"
				aria-label={ __( 'Backup activity', 'jetpack-backup-pkg' ) }
			>
				{ activityFailed ? (
					<QueryError
						className="jpb-query-error--standalone"
						title={ __( "We couldn't load your site's activity.", 'jetpack-backup-pkg' ) }
						error={ activity.error }
						onRetry={ activity.refetch }
						isRetrying={ activity.isFetching }
						returnFocusTo={ overviewRef }
					/>
				) : (
					<>
						<ActivityList
							selectedId={ selectedId }
							onSelect={ setSelected }
							view={ view }
							onChangeView={ rememberView }
							finishedRuns={ finishedRuns }
						/>
						<RightPane
							selectedId={ selectedId }
							page={ page }
							pageSize={ pageSize }
							sortOrder={ sortOrder }
							onClearSelected={ clearSelected }
						/>
					</>
				) }
			</div>
		</>
	);
}

/**
 * Why the pane has no item for a selection every lookup has answered for.
 *
 * @param selectedId - The selection id from the URL.
 * @return The message to show beside the way out.
 */
function notFoundMessage( selectedId: string ): string {
	if ( isRestoreRowId( selectedId ) ) {
		// The collection is the last ten restores and has no pages, so there is nowhere else to send the reader.
		return __(
			"That restore isn't among this site's most recent ones any more.",
			'jetpack-backup-pkg'
		);
	}
	if ( isValidRewindId( selectedId ) ) {
		// `useActivityById` searched the log around the backup itself, not just loaded pages.
		return __(
			"That backup couldn't be found. It may no longer be available.",
			'jetpack-backup-pkg'
		);
	}
	// Only loaded pages were searched, so "gone" is not ours to claim.
	return __(
		"That item isn't on this page of the activity log. It may be on another page, or no longer available.",
		'jetpack-backup-pkg'
	);
}

/**
 * Right-pane router for the Overview screen.
 *
 * Resolves the URL-driven `selectedId` to an activity item and renders the
 * matching detail card: `<BackupDetail>` for backup rows and `<ActivityDetail>`
 * for everything else. A selection that resolves to nothing is reported three
 * ways — the log failed, the log has not answered yet, or nothing loaded holds
 * the row — and only the last of those offers to drop the selection.
 *
 * @param props                 - Component props.
 * @param props.selectedId      - Currently selected row id, or null when nothing is selected.
 * @param props.page            - The page currently shown in the list.
 * @param props.pageSize        - The per-page setting currently shown in the list.
 * @param props.sortOrder       - The sort direction currently shown in the list.
 * @param props.onClearSelected - Drops `?selected=` from the URL.
 * @return The rendered detail card or an empty-state placeholder.
 */
function RightPane( {
	selectedId,
	page,
	pageSize,
	sortOrder,
	onClearSelected,
}: {
	selectedId: string | null;
	page: number;
	pageSize: number;
	sortOrder: ActivitySortOrder;
	onClearSelected: () => void;
} ) {
	// All four must match the list's arguments — this reads its cache entry.
	const { item, hasAnswered, error, isFetching, retryLookup } = useActivityById(
		selectedId,
		page,
		pageSize,
		sortOrder
	);
	// Paused (offline) or disabled queries never answer, and the list cannot load either.
	if ( ! selectedId && ! error && ! hasAnswered && ! isFetching ) {
		return null;
	}
	if ( ! item && ! error && ! hasAnswered ) {
		return (
			<div className="jpb-overview__detail jpb-overview__detail--empty">
				{ /* `Spinner` is `role="presentation"` with no text, so on its own this branch is silent. */ }
				<Spinner />
				<VisuallyHidden>{ __( 'Loading item details…', 'jetpack-backup-pkg' ) }</VisuallyHidden>
			</div>
		);
	}
	if ( ! selectedId ) {
		// The list beside this pane already reports a failed log.
		if ( error ) {
			return null;
		}
		return (
			<div className="jpb-overview__detail jpb-overview__detail--empty">
				<Text>{ __( 'Select an item from the list to see details.', 'jetpack-backup-pkg' ) }</Text>
			</div>
		);
	}
	if ( ! item && error ) {
		return (
			<div className="jpb-overview__detail jpb-overview__detail--empty">
				{ /* Only the independent lookup needs its own report; the list reports page failures. */ }
				<QueryError
					title={ __( "We couldn't load this item.", 'jetpack-backup-pkg' ) }
					error={ retryLookup ? error : undefined }
					onRetry={ retryLookup }
					isRetrying={ isFetching }
					silent={ ! retryLookup }
				/>
			</div>
		);
	}
	if ( ! item ) {
		return (
			<div className="jpb-overview__detail jpb-overview__detail--empty">
				<Stack direction="column" gap="sm" align="center">
					<Text>{ notFoundMessage( selectedId ) }</Text>
					<Button variant="outline" onClick={ onClearSelected }>
						{ __( 'Clear selection', 'jetpack-backup-pkg' ) }
					</Button>
				</Stack>
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
