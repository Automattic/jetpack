/**
 * External dependencies
 */
import { DataViews } from '@wordpress/dataviews/wp';
/**
 * Internal dependencies
 */
import FormsResponsesTabs from '../forms-responses-tabs/index.tsx';
import InboxStatusToggle from '../inbox-status-toggle/index.tsx';
import './style.scss';

/**
 * Shared header row for DataViews-based screens.
 *
 * Structure:
 * - Left: Forms / Responses tabs
 * - Special case: when requested by the parent, show Inbox/Spam/Trash toggle instead
 * - Right: DataViews Search / Filters toggle / View config
 * - Below (only when there are active filters): DataViews.FiltersToggled
 *
 * @param {object}                   props                           - Component props.
 * @param {(status: string) => void} [props.onLegacyStatusChange]    - Optional callback invoked when the legacy Inbox status changes.
 * @param {boolean}                  [props.isInboxStatusToggleView] - Whether to show InboxStatusToggle instead of top tabs.
 * @param {boolean}                  [props.hasLockedFilter]         - Whether a locked filter is present (e.g. single-form filter).
 * @return {JSX.Element} Header row markup for DataViews pages.
 */
export default function DataViewsHeaderRow( {
	onLegacyStatusChange,
	isInboxStatusToggleView = false,
	hasLockedFilter = false,
}: {
	onLegacyStatusChange?: ( status: string ) => void;
	isInboxStatusToggleView?: boolean;
	hasLockedFilter?: boolean;
} ): JSX.Element {
	const showFiltersToggle = isInboxStatusToggleView && ! hasLockedFilter;

	return (
		<>
			<div className="jp-forms-view-actions">
				<div>
					{ isInboxStatusToggleView ? (
						<InboxStatusToggle onChange={ onLegacyStatusChange } />
					) : (
						<FormsResponsesTabs />
					) }
				</div>
				<div className="jp-forms-view-actions__controls">
					<DataViews.Search />
					{ showFiltersToggle ? <DataViews.FiltersToggle /> : null }
					<DataViews.ViewConfig />
				</div>
			</div>
			<DataViews.FiltersToggled className="jp-forms-filters-container" />
		</>
	);
}
