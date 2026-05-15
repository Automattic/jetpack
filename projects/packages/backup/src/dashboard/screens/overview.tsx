import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Button, Stack, Text } from '@wordpress/ui';
import ActivityDetail from '../components/activity-detail';
import ActivityList from '../components/activity-list';
import BackupDetail from '../components/backup-detail';
import DashboardLayout from '../components/dashboard-layout';
import { getCachedActivityById } from '../hooks/use-activity-log';
import { isBackupItem } from '../types/activity';

type OverviewSearch = Record< string, unknown > & { selected?: string };

/**
 * Overview screen for the modernized Backup dashboard.
 *
 * Renders the shared `<DashboardLayout>` chrome around a two-pane body: the
 * left pane is the searchable, paginated activity list; the right pane is an
 * empty-state placeholder until the backup-detail commit lands. Selection is
 * persisted in the URL via `?selected=<id>` so a refresh preserves it.
 *
 * @return The rendered Overview screen.
 */
export default function OverviewScreen() {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as OverviewSearch;
	const navigate = useNavigate();
	const selectedId = typeof search.selected === 'string' ? search.selected : null;

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
					<Button variant="tertiary" disabled>
						{ __( 'Apr 16, 2026 to May 15, 2026', 'jetpack-backup-pkg' ) }
					</Button>
					<Button variant="secondary" disabled>
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
	const item = getCachedActivityById( selectedId );
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
