import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { Button, Stack, Text } from '@wordpress/ui';
import ActivityDetail from '../components/activity-detail';
import ActivityList from '../components/activity-list';
import BackupDetail from '../components/backup-detail';
import DashboardLayout from '../components/dashboard-layout';
import { MOCK_ACTIVITY_LOG, findActivityById } from '../fixtures/activity-log';
import { isBackupItem } from '../types/activity';
import type { ActivityItem } from '../types/activity';

type OverviewSearch = Record< string, unknown > & { selected?: string };

/**
 * Returns the selection id of the newest backup row in the fixture, so the
 * Overview can preselect it on first load and keep the right pane populated.
 *
 * @param items - Activity items to scan.
 * @return The newest backup's rewindId, or null when none exists.
 */
function findDefaultSelection( items: readonly ActivityItem[] ): string | null {
	for ( const item of items ) {
		if ( isBackupItem( item ) ) {
			return item.rewindId;
		}
	}
	return null;
}

/**
 * Overview screen for the modernized Backup dashboard.
 *
 * Renders the shared `<DashboardLayout>` chrome around a two-pane body: the
 * left pane is the searchable activity list; the right pane resolves the
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
	const defaultSelectedId = useMemo( () => findDefaultSelection( MOCK_ACTIVITY_LOG ), [] );
	const selectedId = typeof search.selected === 'string' ? search.selected : defaultSelectedId;

	const setSelected = useCallback(
		( id: string ) => {
			// Merge into existing search so future params (filters, range, etc.) aren't dropped.
			navigate( {
				search: { ...search, selected: id },
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate, search ]
	);

	return (
		<DashboardLayout
			actions={
				<Stack direction="row" gap="sm">
					<Button variant="outline" tone="neutral">
						<Button.Icon icon={ calendar } />
						{ /* Placeholder copy for the upcoming date-range filter — not translated until the real UI lands. */ }
						Apr 16, 2026 to May 15, 2026
					</Button>
					<Button variant="outline" tone="neutral">
						{ __( 'Back up now', 'jetpack-backup-pkg' ) }
					</Button>
				</Stack>
			}
		>
			<div className="jpb-overview">
				<ActivityList selectedId={ selectedId } onSelect={ setSelected } />
				<RightPane selectedId={ selectedId } />
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
 * @return The rendered detail card or an empty-state placeholder.
 */
function RightPane( { selectedId }: { selectedId: string | null } ) {
	if ( ! selectedId ) {
		return (
			<div className="jpb-overview__detail jpb-overview__detail--empty">
				<Text>{ __( 'Select an item from the list to see details.', 'jetpack-backup-pkg' ) }</Text>
			</div>
		);
	}
	const item = findActivityById( selectedId );
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
