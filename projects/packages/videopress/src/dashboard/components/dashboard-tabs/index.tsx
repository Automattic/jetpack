/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';

export type DashboardTab = 'library' | 'overview' | 'settings';

export const TAB_PATHS: Record< DashboardTab, string > = {
	library: '/',
	overview: '/stats',
	settings: '/settings',
};

/**
 * The Videos / Stats / Settings tab strip. Must be rendered inside a
 * `<Tabs.Root>` whose `value` and `onValueChange` are managed by the parent
 * (DashboardLayout) so the strip and its sibling `<Tabs.Panel>`s share
 * Tabs context. The tab values keep their original keys (`library`,
 * `overview`) for stability; only the visible labels and routes changed.
 *
 * @return The tab list element.
 */
export default function DashboardTabs() {
	return (
		<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
			<Tabs.List variant="minimal">
				<Tabs.Tab value="library">{ __( 'Videos', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="overview">{ __( 'Stats', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
			</Tabs.List>
		</div>
	);
}
