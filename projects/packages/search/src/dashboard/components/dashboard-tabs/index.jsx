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
 * Tab list rendered in the Search dashboard header.
 *
 * Must be rendered inside an external `Tabs.Root` so the matching
 * `Tabs.Panel`s can live with the page content (see `dashboard-page.jsx`).
 * The Tab/Panel count must match — `@wordpress/ui` validates this in dev.
 *
 * @return {import('react').ReactElement} The tab list.
 */
export default function SearchDashboardTabs() {
	return (
		<div className="jp-search-dashboard-tabs">
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
		</div>
	);
}
