import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Text } from '@wordpress/ui';
import ActivityDetail from '../components/activity-detail';
import ActivityList from '../components/activity-list';
import BackupDetail from '../components/backup-detail';
import BackupNowButton from '../components/backup-now-button';
import BackupStatusPanel, { replacesOverview } from '../components/backup-status';
import BackupStatusBanner from '../components/backup-status/banner';
import DashboardLayout from '../components/dashboard-layout';
import {
	ACTIVITY_LOG_DEFAULT_PER_PAGE,
	useActivityById,
	useDefaultBackupRewindId,
	useHasRestorePoints,
} from '../hooks/use-activity-log';
import { useBackups } from '../hooks/use-backups';
import { isBackupItem } from '../types/activity';
import type { View } from '@wordpress/dataviews';

type OverviewSearch = Record< string, unknown > & { selected?: string };

const INITIAL_VIEW: View = {
	type: 'list',
	page: 1,
	perPage: ACTIVITY_LOG_DEFAULT_PER_PAGE,
	filters: [],
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
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as OverviewSearch;
	const navigate = useNavigate();
	// View state lives here so RightPane's `useActivityById` can
	// subscribe to the same paginated query the list reads from.
	const [ view, setView ] = useState< View >( INITIAL_VIEW );
	const page = view.page ?? 1;
	const perPage = view.perPage ?? ACTIVITY_LOG_DEFAULT_PER_PAGE;
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
	const { state: backupsState, progress, isInitialBackup } = useBackups();
	// A second opinion on whether anything is restorable, from the
	// paginated activity log rather than the short `/backups` window.
	// While it is still unknown, assume there *are* restore points:
	// briefly showing the two-pane view is a milder error than briefly
	// telling an established customer they have no backups.
	const { hasRestorePoints, isLoading: restorePointsLoading } = useHasRestorePoints();

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
		replacesOverview( backupsState, isInitialBackup, restorePointsLoading || hasRestorePoints )
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
			<div className="jpb-overview">
				<ActivityList
					selectedId={ selectedId }
					onSelect={ setSelected }
					view={ view }
					onChangeView={ setView }
				/>
				<RightPane selectedId={ selectedId } page={ page } pageSize={ perPage } />
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
 * @return The rendered detail card or an empty-state placeholder.
 */
function RightPane( {
	selectedId,
	page,
	pageSize,
}: {
	selectedId: string | null;
	page: number;
	pageSize: number;
} ) {
	const item = useActivityById( selectedId, page, pageSize );
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
		return <BackupDetail item={ item } />;
	}
	return <ActivityDetail item={ item } />;
}
