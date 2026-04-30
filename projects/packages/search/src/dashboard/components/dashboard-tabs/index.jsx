import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import {
	SEARCH_DASHBOARD_TAB_PLAN_USAGE,
	SEARCH_DASHBOARD_TAB_SETTINGS,
	SEARCH_DASHBOARD_TABS,
} from './constants';
import './style.scss';

const TAB_LABELS = {
	[ SEARCH_DASHBOARD_TAB_SETTINGS ]: __( 'Settings', 'jetpack-search-pkg' ),
	[ SEARCH_DASHBOARD_TAB_PLAN_USAGE ]: __( 'Plan & usage', 'jetpack-search-pkg' ),
};

/**
 * Tab navigation rendered in the Search dashboard header.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.value    - Active tab id.
 * @param {Function} props.onChange - Called with the next tab id.
 * @return {import('react').ReactElement} The tab list.
 */
export default function SearchDashboardTabs( { value, onChange } ) {
	return (
		<div className="jp-search-dashboard-tabs">
			<Tabs.Root
				value={ value }
				onValueChange={ onChange }
				className="jp-search-dashboard-tabs__root"
			>
				<Tabs.List
					className="jp-search-dashboard-tabs__list"
					aria-label={ __( 'Search dashboard sections', 'jetpack-search-pkg' ) }
				>
					{ SEARCH_DASHBOARD_TABS.map( tab => (
						<Tabs.Tab key={ tab } value={ tab } className="jp-search-dashboard-tabs__tab">
							{ TAB_LABELS[ tab ] }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			</Tabs.Root>
		</div>
	);
}
