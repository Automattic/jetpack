/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';

export type DashboardTab = 'overview' | 'library' | 'settings';

export const TAB_PATHS: Record< DashboardTab, string > = {
	overview: '/',
	library: '/library',
	settings: '/settings',
};

/**
 * The Overview / Library / Settings tab strip. Must be rendered inside a
 * `<Tabs.Root>` whose `value` and `onValueChange` are managed by the parent
 * (DashboardLayout) so the strip and its sibling `<Tabs.Panel>`s share
 * Tabs context.
 *
 * @return The tab list element.
 */
export default function DashboardTabs() {
	return (
		<div className="jp-admin-page-tabs">
			<Tabs.List>
				<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="library">{ __( 'Library', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
			</Tabs.List>
		</div>
	);
}
