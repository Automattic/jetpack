/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';

export type DashboardTab = 'overview' | 'library' | 'playlists' | 'settings';

export const TAB_PATHS: Record< DashboardTab, string > = {
	overview: '/',
	library: '/library',
	playlists: '/playlists',
	settings: '/settings',
};

type Props = {
	showPlaylists: boolean;
};

/**
 * The Overview / Library / Settings tab strip. Must be rendered inside a
 * `<Tabs.Root>` whose `value` and `onValueChange` are managed by the parent
 * (DashboardLayout) so the strip and its sibling `<Tabs.Panel>`s share
 * Tabs context.
 *
 * @param props               - Component props.
 * @param props.showPlaylists - Whether to render the feature-flagged Playlists
 *                            tab. Prop-driven — the parent reads the flag —
 *                            so this strip stays free of global reads.
 * @return The tab list element.
 */
export default function DashboardTabs( { showPlaylists }: Props ) {
	return (
		<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
			<Tabs.List variant="minimal">
				<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="library">{ __( 'Library', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				{ showPlaylists && (
					<Tabs.Tab value="playlists">{ __( 'Playlists', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				) }
				<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
			</Tabs.List>
		</div>
	);
}
