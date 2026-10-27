import { useCallback, useLayoutEffect, useRef, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { Icon, Popover, Tabs, VisuallyHidden } from '@wordpress/ui';
import { isGated } from '../data/is-gated';
import type { ReactNode, RefObject } from 'react';

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

const geoInfotipLabel = __( 'What is GEO?', 'jetpack-seo' );

/**
 * An "infotip" explaining the GEO acronym, sat beside the GEO tab.
 *
 * A `Popover` with `openOnHover` rather than a `Tooltip`, following the design
 * system's own guidance: tooltip popups aren't exposed to assistive technologies
 * (only the trigger's accessible name is) and are disabled outright on touch
 * devices, so a tooltip would show this to sighted mouse users only. A popover
 * opens on hover, click and tap, and its content is announced.
 *
 * It renders *after* `Tabs.List` rather than inside it. `Tabs.Tab` is a
 * `<button>`, so nesting the trigger in the GEO tab would put a button inside a
 * button — invalid, and it would break the list's arrow-key navigation. A
 * non-tab child of the `tablist` has the same problem. Settings comes after GEO,
 * so the trigger is positioned over a gap the GEO tab leaves after itself (see
 * `useInfotipOffset`) to keep it visually beside the tab it explains.
 *
 * @param props        - Component props.
 * @param props.offset - Where the trigger starts, in px from the strip's inline-start edge.
 * @return The GEO infotip.
 */
const GeoInfotip = ( { offset }: { offset?: number } ) => (
	<Popover.Root>
		<Popover.Trigger
			openOnHover
			delay={ 200 }
			closeDelay={ 200 }
			aria-label={ geoInfotipLabel }
			className="jetpack-seo-tabs-strip__infotip"
			style={ { insetInlineStart: offset } }
		>
			<Icon icon={ info } size={ 20 } />
		</Popover.Trigger>
		<Popover.Popup className="jetpack-seo-tabs-strip__infotip-popup">
			<Popover.Arrow />
			<VisuallyHidden render={ <Popover.Title /> }>{ geoInfotipLabel }</VisuallyHidden>
			<Popover.Description>
				{ __(
					'GEO stands for generative engine optimization. These settings control how AI sees and uses your site.',
					'jetpack-seo'
				) }
			</Popover.Description>
		</Popover.Popup>
	</Popover.Root>
);

/**
 * Where the GEO infotip starts, in px from the tab strip's inline-start edge:
 * the GEO tab's inline-end edge. Measured rather than laid out because the
 * infotip can't sit inside the tab list (see `GeoInfotip`), and the tab's
 * position depends on the translated labels before it.
 *
 * Re-measured when the strip, the list or the GEO tab resizes (viewport, fonts
 * loading) and when the list scrolls, which it does when the tabs overflow.
 *
 * @param stripRef  - The tab strip, which is the infotip's containing block.
 * @param geoTabRef - The GEO tab.
 * @param enabled   - Whether the GEO tab is shown at all.
 * @return The offset, or `undefined` before the first measurement.
 */
function useInfotipOffset(
	stripRef: RefObject< HTMLDivElement | null >,
	geoTabRef: RefObject< HTMLButtonElement | null >,
	enabled: boolean
): number | undefined {
	const [ offset, setOffset ] = useState< number >();

	useLayoutEffect( () => {
		const strip = stripRef.current;
		const geoTab = geoTabRef.current;
		if ( ! enabled || ! strip || ! geoTab ) {
			return;
		}
		const list = geoTab.closest( '[role="tablist"]' );

		const measure = () => {
			const stripRect = strip.getBoundingClientRect();
			const tabRect = geoTab.getBoundingClientRect();
			const isRtl = window.getComputedStyle( strip ).direction === 'rtl';
			setOffset( isRtl ? stripRect.right - tabRect.left : tabRect.right - stripRect.left );
		};

		measure();
		list?.addEventListener( 'scroll', measure, { passive: true } );
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver( measure );
		[ strip, list, geoTab ].forEach( element => element && observer?.observe( element ) );

		return () => {
			list?.removeEventListener( 'scroll', measure );
			observer?.disconnect();
		};
	}, [ stripRef, geoTabRef, enabled ] );

	return offset;
}

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

	// On plan-gated sites (below-Premium WordPress.com) the Content and GEO tabs are
	// paid features, so only Overview + Settings show. Their routes also redirect to
	// Overview if reached directly (see the route stages).
	const gated = isGated();

	const stripRef = useRef< HTMLDivElement >( null );
	const geoTabRef = useRef< HTMLButtonElement >( null );
	const infotipOffset = useInfotipOffset( stripRef, geoTabRef, ! gated );

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( isSeoTab( next ) ) {
				navigate( { href: ROUTE_BY_TAB[ next ] } );
			}
		},
		[ navigate ]
	);

	return (
		<Tabs.Root className="jetpack-seo-tabs" value={ active } onValueChange={ onTabChange }>
			<div
				ref={ stripRef }
				className="jp-admin-page-tabs jp-admin-page-tabs--minimal jetpack-seo-tabs-strip"
			>
				<Tabs.List variant="minimal">
					<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-seo' ) }</Tabs.Tab>
					{ ! gated && <Tabs.Tab value="content">{ __( 'Content', 'jetpack-seo' ) }</Tabs.Tab> }
					{ ! gated && (
						<Tabs.Tab ref={ geoTabRef } value="geo" className="jetpack-seo-tabs-strip__geo-tab">
							{ _x(
								'GEO',
								'Generative Engine Optimization; the SEO dashboard tab label',
								'jetpack-seo'
							) }
						</Tabs.Tab>
					) }
					<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-seo' ) }</Tabs.Tab>
				</Tabs.List>
				{ /* Same gate as the tab it explains — no orphaned icon on gated sites. */ }
				{ ! gated && <GeoInfotip offset={ infotipOffset } /> }
			</div>
			{ children }
		</Tabs.Root>
	);
};

export default DashboardNav;
