import { AdminPage, ThemeProvider } from '@automattic/jetpack-components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { recordScreenViewOnce, recordSeoEvent } from '../data/record-seo-event';
import DashboardNav from './dashboard-nav';
import DashboardNotices from './dashboard-notices';
import '../admin-page-layout.scss';
import type { SeoTab } from './dashboard-nav';
import type { ReactNode } from 'react';

// Each tab's content column. The Content tab runs full width.
const COLUMN_BY_TAB: Partial< Record< SeoTab, 'narrow' | 'wide' > > = {
	overview: 'wide',
	settings: 'narrow',
	geo: 'narrow',
};

interface Props {
	/** The tab for the currently rendered route (drives the active nav state). */
	active: SeoTab;
	/**
	 * Whether to render the Jetpack footer. DataViews tabs own their own scroll
	 * area and pinned pagination, so they hide it. Defaults to `true`.
	 */
	showFooter?: boolean;
	/**
	 * Render the content flush, with no page padding. Full-bleed DataViews tabs
	 * supply their own spacing, so they opt out of the shared content padding.
	 * Defaults to `false`.
	 */
	flush?: boolean;
	/**
	 * Whether to render the tab bar. The module-off stage hides it, since every
	 * tab would show the same enable prompt (except on plan-gated sites, see
	 * `SeoDisabledStage`). Defaults to `true`.
	 */
	showTabs?: boolean;
	/**
	 * Fill the content area and center the content in it, for a stage whose only
	 * content is a short message (the module-off empty state). Defaults to `false`.
	 */
	centered?: boolean;
	children: ReactNode;
}

/**
 * Shared chrome for every SEO dashboard route: the `AdminPage` page frame
 * (`@automattic/jetpack-components`) plus the route-based tab navigation. Each
 * route's `stage` wraps its screen in this so the header, tabs and footer are
 * identical across Overview / Settings / Content / GEO. The shell (nav included) is part of
 * each route's stage, so it re-renders on navigation rather than persisting
 * beneath a swapped panel.
 *
 * @param props            - Component props.
 * @param props.active     - The active tab for the current route.
 * @param props.showFooter - Whether to render the Jetpack footer (default true).
 * @param props.flush      - Render content with no page padding (default false).
 * @param props.showTabs   - Whether to render the tab bar (default true).
 * @param props.centered   - Fill the content area and center the content (default false).
 * @param props.children   - The route's screen content.
 * @return The SEO dashboard page chrome.
 */
const DashboardPage = ( {
	active,
	showFooter = true,
	flush = false,
	showTabs = true,
	centered = false,
	children,
}: Props ) => {
	useEffect( () => recordScreenViewOnce( active ), [ active ] );

	// The admin shell keeps this page mounted, so a return to it is a new visit: see the admin-ui README.
	useEffect( () => {
		const onShown = ( event: Event ) => {
			const { page, firstShow } = ( event as CustomEvent ).detail ?? {};
			if ( page === 'jetpack-seo' && ! firstShow ) {
				recordSeoEvent( 'jetpack_seo_screen_viewed', active );
			}
		};
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );
		return () => window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );
	}, [ active ] );

	// Top the column with the notices so they line up; full-bleed and centered stages have no column.
	const column = ! flush && ! centered && COLUMN_BY_TAB[ active ];
	const content = (
		<>
			{ ! column && <DashboardNotices /> }
			<div
				className={ clsx( 'jetpack-seo-page-content', {
					'jetpack-seo-page-content--flush': flush,
					'jetpack-seo-page-content--centered': centered,
				} ) }
			>
				{ column ? (
					<div className={ `jetpack-seo-page-column jetpack-seo-page-column--${ column }` }>
						<DashboardNotices />
						{ children }
					</div>
				) : (
					children
				) }
			</div>
		</>
	);

	return (
		<ThemeProvider>
			<AdminPage
				title="SEO"
				subTitle={ __(
					'Make your site discoverable in search and social, and control AI access.',
					'jetpack-seo'
				) }
				showFooter={ showFooter }
			>
				{ showTabs ? <DashboardNav active={ active }>{ content }</DashboardNav> : content }
			</AdminPage>
		</ThemeProvider>
	);
};

export default DashboardPage;
