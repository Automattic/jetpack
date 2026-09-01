/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';

export type DashboardTab = 'library' | 'stats' | 'settings';

export const TAB_PATHS: Record< DashboardTab, string > = {
	library: '/',
	stats: '/stats',
	settings: '/settings',
};

/**
 * The Library / Stats / Settings tab strip. Must be rendered inside a
 * `<Tabs.Root>` whose `value` and `onValueChange` are managed by the parent
 * (DashboardLayout) so the strip and its sibling `<Tabs.Panel>`s share
 * Tabs context.
 *
 * @return The tab list element.
 */
export default function DashboardTabs() {
	return (
		<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
			<Tabs.List variant="minimal">
				<Tabs.Tab value="library">{ __( 'Library', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="stats">{ __( 'Stats', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
			</Tabs.List>
		</div>
	);
}
