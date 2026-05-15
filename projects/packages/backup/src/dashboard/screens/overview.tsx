import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Button, Stack, Text } from '@wordpress/ui';
import ActivityList from '../components/activity-list';
import DashboardLayout from '../components/dashboard-layout';

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
				<div className="jpb-overview__detail jpb-overview__detail--empty">
					<Text>
						{ __( 'Select an item from the list to see details.', 'jetpack-backup-pkg' ) }
					</Text>
				</div>
			</div>
		</DashboardLayout>
	);
}
