import { __ } from '@wordpress/i18n';
import './style.scss';

const TABS = [
	{ id: 'plan-usage', label: __( 'Plan & Usage', 'jetpack-search-pkg' ) },
	{
		id: 'ai-answers',
		label: (
			<>
				{ __( 'AI Answers', 'jetpack-search-pkg' ) }
				<span className="jp-search-dashboard-tabs__tab-preview-label">
					{ __( '(Preview)', 'jetpack-search-pkg' ) }
				</span>
			</>
		),
	},
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
