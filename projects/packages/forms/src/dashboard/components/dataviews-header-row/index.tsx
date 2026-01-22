/**
 * External dependencies
 */
import { DataViews } from '@wordpress/dataviews/wp';
import { useLocation } from 'react-router';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import FormsResponsesTabs from '../forms-responses-tabs/index.tsx';
import InboxStatusToggle from '../inbox-status-toggle/index.tsx';
import './style.scss';

/**
 * Shared header row for DataViews-based screens.
 *
 * Structure:
 * - Left: Forms / Responses tabs
 * - Special case: on the Responses screen with CFM disabled, show Inbox/Spam/Trash toggle instead
 * - Right: DataViews Search / Filters toggle / View config
 * - Below (only when there are active filters): DataViews.FiltersToggled
 *
 * @param {object}                   props                        - Component props.
 * @param {(status: string) => void} [props.onLegacyStatusChange] - Optional callback invoked when the legacy Inbox status changes.
 * @return {JSX.Element} Header row markup for DataViews pages.
 */
export default function DataViewsHeaderRow( {
	onLegacyStatusChange,
}: {
	onLegacyStatusChange?: ( status: string ) => void;
} ): JSX.Element {
	const location = useLocation();
	const isCentralFormManagementEnabled = useConfigValue( 'isCentralFormManagementEnabled' );
	const isCentralFormManagementDisabled = isCentralFormManagementEnabled === false;
	const isResponsesScreen = location.pathname === '/responses';

	return (
		<>
			<div className="jp-forms-view-actions">
				<div>
					{ isResponsesScreen && isCentralFormManagementDisabled ? (
						<InboxStatusToggle onChange={ onLegacyStatusChange } />
					) : (
						<FormsResponsesTabs />
					) }
				</div>
				<div className="jp-forms-view-actions__controls">
					<DataViews.Search />
					{ isCentralFormManagementEnabled === true ? null : <DataViews.FiltersToggle /> }
					<DataViews.ViewConfig />
				</div>
			</div>
			<DataViews.FiltersToggled className="jp-forms-filters-container" />
		</>
	);
}
