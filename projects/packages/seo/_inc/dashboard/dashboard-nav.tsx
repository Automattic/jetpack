import { useCallback, useLayoutEffect, useRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import type { ReactNode } from 'react';

export type SeoTab = 'overview' | 'settings' | 'content' | 'geo';

// Each tab is its own wp-build route; selecting one navigates there. Overview is
// the default route, so it lives at the bare page URL (`/`).
export const ROUTE_BY_TAB: Record< SeoTab, string > = {
	overview: '/',
	settings: '/settings',
	content: '/content',
	geo: '/geo',
};

const isSeoTab = ( value: string | null ): value is SeoTab =>
	value !== null && Object.hasOwn( ROUTE_BY_TAB, value );

/**
 * The SEO dashboard's top navigation — a `@wordpress/ui` tab bar that drives
 * route-based navigation. Every tab has an associated panel, with only the active
 * route content mounted.
 *
 * The route's content is rendered as `children` INSIDE `Tabs.Root`, so the
 * sticky tab strip's containing block spans the full page height and stays
 * pinned while the content scrolls. This mirrors the modernized Newsletter and
 * VideoPress dashboards; rendering the content as a sibling of `Tabs.Root`
 * leaves the strip in a strip-height containing block and it unsticks on scroll.
 *
 * @param props          - Component props.
 * @param props.active   - The tab for the currently rendered route.
 * @param props.showTabs - Whether to show the tab strip (default true).
 * @param props.children - The route's content, rendered inside `Tabs.Root`.
 * @return The dashboard tab navigation wrapping the route content.
 */
const DashboardNav = ( {
	active,
	showTabs = true,
	children,
}: {
	active: SeoTab;
	showTabs?: boolean;
	children: ReactNode;
} ) => {
	const navigate = useNavigate();
	const rootRef = useRef< HTMLDivElement >( null );

	useLayoutEffect( () => {
		const root = rootRef.current;
		if ( ! root ) {
			return;
		}
		const ownerDocument = root.ownerDocument;
		const body = ownerDocument.body;
		// Each route mounts its own nav, so the focus handoff lives on the body.
		const previousFocus = body.dataset.jetpackSeoTabFocus;
		delete body.dataset.jetpackSeoTabFocus;
		let focusFrame = 0;
		const focusAtMount = ownerDocument.activeElement;
		if ( previousFocus ) {
			const selectedTab = root.querySelector< HTMLElement >( '[role="tab"][aria-selected="true"]' );
			// DataViews can focus its filter toggle while the Content route mounts.
			if (
				( selectedTab?.id === previousFocus ||
					( isSeoTab( previousFocus ) && previousFocus !== active ) ) &&
				( focusAtMount === body || root.contains( focusAtMount ) )
			) {
				// Let the tabs register their keyboard order before moving focus.
				focusFrame = requestAnimationFrame( () => {
					focusFrame = 0;
					if (
						ownerDocument.activeElement === focusAtMount ||
						ownerDocument.activeElement === body
					) {
						selectedTab?.focus();
					}
				} );
			}
		}

		return () => {
			if ( focusFrame ) {
				cancelAnimationFrame( focusFrame );
				if ( previousFocus && ownerDocument.activeElement === body ) {
					body.dataset.jetpackSeoTabFocus = previousFocus;
				}
			}
			const focused = ownerDocument.activeElement;
			if ( ! focused || ! root.contains( focused ) ) {
				return;
			}
			if ( focused.getAttribute( 'role' ) === 'tab' ) {
				body.dataset.jetpackSeoTabFocus = focused.id;
			} else if ( focused.matches( ':focus-visible' ) ) {
				// Keyboard actions such as the coverage rings can switch tabs from inside a panel.
				body.dataset.jetpackSeoTabFocus = active;
			}
		};
	}, [ active ] );

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( isSeoTab( next ) ) {
				navigate( { href: ROUTE_BY_TAB[ next ] } );
			}
		},
		[ navigate ]
	);

	return (
		<Tabs.Root
			ref={ rootRef }
			className="jetpack-seo-tabs"
			value={ active }
			onValueChange={ onTabChange }
		>
			{ /* Hidden, not removed: the panels still need their tabs. */ }
			<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal" hidden={ ! showTabs }>
				<Tabs.List variant="minimal" aria-label={ __( 'SEO sections', 'jetpack-seo' ) }>
					<Tabs.Tab id="jetpack-seo-tab-overview" value="overview">
						{ __( 'Overview', 'jetpack-seo' ) }
					</Tabs.Tab>
					<Tabs.Tab id="jetpack-seo-tab-content" value="content">
						{ __( 'Content', 'jetpack-seo' ) }
					</Tabs.Tab>
					<Tabs.Tab id="jetpack-seo-tab-geo" value="geo">
						{ _x(
							'GEO',
							'Generative Engine Optimization; the SEO dashboard tab label',
							'jetpack-seo'
						) }
					</Tabs.Tab>
					<Tabs.Tab id="jetpack-seo-tab-settings" value="settings">
						{ __( 'Settings', 'jetpack-seo' ) }
					</Tabs.Tab>
				</Tabs.List>
			</div>
			{ ( Object.keys( ROUTE_BY_TAB ) as SeoTab[] ).map( tab => (
				<Tabs.Panel
					key={ tab }
					value={ tab }
					keepMounted
					// Every panel starts with focusable content, so the panel is not a tab stop.
					tabIndex={ -1 }
					className="jetpack-seo-tab-panel"
				>
					{ active === tab && children }
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
};

export default DashboardNav;
