import { __ } from '@wordpress/i18n';
import './style.scss';

const TABS = [
	{ id: 'overview', label: __( 'Overview', 'jetpack-search-pkg' ) },
	{ id: 'behavior', label: __( 'Behavior', 'jetpack-search-pkg' ) },
	{ id: 'topics', label: __( 'Topics', 'jetpack-search-pkg' ) },
];

/**
 * Stats-style tab bar for the Search dashboard.
 *
 * @param {object}   props             - Component properties.
 * @param {string}   props.activeTab   - The currently active tab id.
 * @param {Function} props.onTabChange - Called with the tab id when a tab is clicked.
 * @return {import('react').Component} DashboardTabs component.
 */
export default function DashboardTabs( { activeTab, onTabChange } ) {
	return (
		<div className="jp-search-dashboard-tabs" role="tablist">
			{ TABS.map( tab => (
				<button
					key={ tab.id }
					role="tab"
					aria-selected={ activeTab === tab.id }
					className={
						'jp-search-dashboard-tabs__tab' +
						( activeTab === tab.id ? ' jp-search-dashboard-tabs__tab--active' : '' )
					}
					onClick={ () => onTabChange( tab.id ) }
				>
					{ tab.label }
				</button>
			) ) }
		</div>
	);
}

export { TABS };
