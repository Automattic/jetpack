/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useFreeTier } from '../../hooks/use-free-tier';

export type DashboardTab = 'upload' | 'stats' | 'library' | 'settings';

export const TAB_PATHS: Record< DashboardTab, string > = {
	upload: '/upload',
	stats: '/stats',
	library: '/',
	settings: '/settings',
};

const TAB_LABELS: Record< DashboardTab, string > = {
	upload: __( 'Upload', 'jetpack-videopress-pkg' ),
	// "Overview" route, surfaced to users as Analytics.
	stats: __( 'Analytics', 'jetpack-videopress-pkg' ),
	library: __( 'Library', 'jetpack-videopress-pkg' ),
	settings: __( 'Settings', 'jetpack-videopress-pkg' ),
};

/**
 * The tab order for the current user state.
 *
 * @param videoCount - Number of videos reported by the dashboard's free-tier state.
 * @return Ordered tab values.
 */
export function getTabOrder( videoCount: number ): DashboardTab[] {
	// Product Compass spec — start with the Library, not Stats (a new user's Stats read as zeros).
	return videoCount > 0
		? [ 'library', 'stats', 'settings' ]
		: [ 'upload', 'library', 'stats', 'settings' ];
}

/**
 * Resolve the visible dashboard tabs from the real library count. useFreeTier()
 * returns videoCount=0 before the first count response, which intentionally
 * keeps the first-run Upload tab visible for unknown/loading state.
 *
 * @return Ordered tab values.
 */
export function useDashboardTabOrder(): DashboardTab[] {
	const { videoCount } = useFreeTier();

	return useMemo( () => getTabOrder( videoCount ), [ videoCount ] );
}

/**
 * The Upload / Analytics / Library / Settings tab strip. Must be rendered
 * inside a `<Tabs.Root>` whose `value` and `onValueChange` are managed by the
 * parent (DashboardLayout) so the strip and its sibling `<Tabs.Panel>`s share
 * Tabs context. Tab order adapts to whether the library is empty.
 *
 * @return The tab list element.
 */
export default function DashboardTabs( { tabs }: { tabs: DashboardTab[] } ) {
	return (
		<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
			<Tabs.List variant="minimal">
				{ tabs.map( tab => (
					<Tabs.Tab key={ tab } value={ tab }>
						{ TAB_LABELS[ tab ] }
					</Tabs.Tab>
				) ) }
			</Tabs.List>
		</div>
	);
}
