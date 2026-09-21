/**
 * WordPress dependencies
 */
import { DataViews } from '@wordpress/dataviews';
import { Stack } from '@wordpress/ui';
import InboxStatusToggle from '../inbox-status-toggle';
import './style.scss';

type StatusTab = 'inbox' | 'spam' | 'trash';

type DataViewsHeaderRowProps = {
	isSingleFormView?: boolean;
	activeStatus?: StatusTab;
	statusCounts?: { inbox: number; spam: number; trash: number };
	onStatusChange?: ( nextStatus: StatusTab ) => void;
};

/**
 * Shared wp-build DataViews header row:
 * - Left: Inbox/Spam/Trash tabs, on a single-form responses view only
 * - Right: DataViews controls (Search + ViewConfig)
 * - Below: DataViews filter pills row (collapses when empty)
 *
 * Moving between Forms and Responses is section navigation, not a tab switch, so
 * it lives in the page header (see `useTopNavigation`).
 *
 * @param props                  - Props.
 * @param props.isSingleFormView - Whether this screen is showing a single-form responses view.
 * @param props.activeStatus     - Current status for the single-form status tabs.
 * @param props.statusCounts     - Status counts for the single-form status tabs.
 * @param props.onStatusChange   - Handler for single-form status tab changes.
 * @return Header row markup for wp-build DataViews screens.
 */
export default function DataViewsHeaderRow( {
	isSingleFormView = false,
	activeStatus,
	statusCounts,
	onStatusChange,
}: DataViewsHeaderRowProps ): JSX.Element {
	return (
		<>
			<Stack className="jp-forms-dataviews__view-actions" justify="space-between">
				{ /* Rendered even when empty: `space-between` needs two children to keep
				     the controls on the end edge. */ }
				<Stack align="center" gap="sm">
					{ isSingleFormView && (
						<InboxStatusToggle
							activeStatus={ activeStatus ?? 'inbox' }
							counts={ statusCounts ?? { inbox: 0, spam: 0, trash: 0 } }
							onChange={ onStatusChange ?? ( () => {} ) }
						/>
					) }
				</Stack>
				<Stack align="center" gap="sm">
					<DataViews.Search />
					{ isSingleFormView ? <DataViews.FiltersToggle /> : null }
					<DataViews.ViewConfig />
				</Stack>
			</Stack>
			<DataViews.FiltersToggled className="jp-forms-dataviews-filters__container" />
		</>
	);
}
