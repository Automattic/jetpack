import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import type { ReactNode } from 'react';

export type SeoTab = 'overview' | 'settings' | 'content' | 'ai';

// Each tab is its own wp-build route; selecting one navigates there. Overview is
// the default route, so it lives at the bare page URL (`/`).
const ROUTE_BY_TAB: Record< SeoTab, string > = {
	overview: '/',
	settings: '/settings',
	content: '/content',
	ai: '/ai',
};

/**
 * The SEO dashboard's top navigation — a `@wordpress/ui` tab bar that drives
 * route-based navigation (no `Tabs.Panel`; each tab's content is its route's
 * stage). The active tab is supplied by the current route's stage rather than
 * derived from the URL, mirroring the Jetpack Forms dashboard.
 *
 * The route's content is rendered as `children` INSIDE `Tabs.Root`, so the
 * sticky tab strip's containing block spans the full page height and stays
 * pinned while the content scrolls. This mirrors the modernized Newsletter and
 * VideoPress dashboards; rendering the content as a sibling of `Tabs.Root`
 * leaves the strip in a strip-height containing block and it unsticks on scroll.
 *
 * @param props          - Component props.
 * @param props.active   - The tab for the currently rendered route.
 * @param props.children - The route's content, rendered inside `Tabs.Root`.
 * @return The dashboard tab navigation wrapping the route content.
 */
const DashboardNav = ( { active, children }: { active: SeoTab; children: ReactNode } ) => {
	const navigate = useNavigate();

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next === 'overview' || next === 'settings' || next === 'content' || next === 'ai' ) {
				navigate( { href: ROUTE_BY_TAB[ next ] } );
			}
		},
		[ navigate ]
	);

	return (
		<Tabs.Root className="jetpack-seo-tabs" value={ active } onValueChange={ onTabChange }>
			<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
				<Tabs.List variant="minimal">
					<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-seo' ) }</Tabs.Tab>
					<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-seo' ) }</Tabs.Tab>
					<Tabs.Tab value="content">{ __( 'Content', 'jetpack-seo' ) }</Tabs.Tab>
					<Tabs.Tab value="ai">{ __( 'AI', 'jetpack-seo' ) }</Tabs.Tab>
				</Tabs.List>
			</div>
			{ children }
		</Tabs.Root>
	);
};

export default DashboardNav;
