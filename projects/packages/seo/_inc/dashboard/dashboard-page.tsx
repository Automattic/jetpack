import { AdminPage, ThemeProvider } from '@automattic/jetpack-components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { recordScreenViewOnce } from '../data/record-seo-event';
import DashboardNav from './dashboard-nav';
import '../admin-page-layout.scss';
import type { SeoTab } from './dashboard-nav';
import type { ReactNode } from 'react';

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

	const content = (
		<div
			className={ clsx( 'jetpack-seo-page-content', {
				'jetpack-seo-page-content--flush': flush,
				'jetpack-seo-page-content--centered': centered,
			} ) }
		>
			{ children }
		</div>
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
