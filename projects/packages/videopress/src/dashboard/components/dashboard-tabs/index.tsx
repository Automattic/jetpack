/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { useFirstRunState, type FirstRunState } from '../../hooks/use-first-run-state';

export type DashboardTab = 'home' | 'stats' | 'library' | 'settings';

export const TAB_PATHS: Record< DashboardTab, string > = {
	home: '/home',
	stats: '/stats',
	library: '/',
	settings: '/settings',
};

const TAB_LABELS: Record< DashboardTab, string > = {
	home: __( 'Home', 'jetpack-videopress-pkg' ),
	// "Overview" route, surfaced to users as Analytics.
	stats: __( 'Analytics', 'jetpack-videopress-pkg' ),
	library: __( 'Library', 'jetpack-videopress-pkg' ),
	settings: __( 'Settings', 'jetpack-videopress-pkg' ),
};

// Left-to-right order every tab keeps whenever it is shown. `getTabOrder`
// picks a subset of this; DashboardLayout falls back to it when it has to
// re-insert the active tab (see its `visibleTabs`).
export const CANONICAL_TAB_ORDER: DashboardTab[] = [ 'home', 'library', 'stats', 'settings' ];

/**
 * The tab order for the current dashboard shape.
 *
 * On first run the Library leads: with nothing uploaded yet, its empty state
 * IS the upload flow, so the landing tab and the one job coincide. Home joins
 * the strip once there is something to come back to — a brand-new user's Home
 * would only echo the same empty state.
 *
 * @param firstRunState - The resolved first-run state.
 * @return Ordered tab values.
 */
export function getTabOrder( firstRunState: FirstRunState ): DashboardTab[] {
	// Product Compass spec — never lead with Stats (a new user's Stats read as zeros).
	return firstRunState === 'first-run'
		? [ 'library', 'stats', 'settings' ]
		: [ 'home', 'library', 'stats', 'settings' ];
}

/**
 * Resolve the visible dashboard tabs from the real first-run state.
 *
 * @return Ordered tab values.
 */
export function useDashboardTabOrder(): DashboardTab[] {
	const firstRunState = useFirstRunState();

	return useMemo( () => getTabOrder( firstRunState ), [ firstRunState ] );
}

/**
 * The dashboard tab strip. Must be rendered inside a `<Tabs.Root>` whose
 * `value` and `onValueChange` are managed by the parent (DashboardLayout) so
 * the strip and its sibling `<Tabs.Panel>`s share Tabs context. Tab order
 * adapts to the first-run state.
 *
 * @param props      - Component props.
 * @param props.tabs - Tab values to render, in order.
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
