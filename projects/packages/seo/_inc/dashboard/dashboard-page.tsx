import { AdminPage, ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
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
	children: ReactNode;
}

/**
 * Shared chrome for every SEO dashboard route: the `AdminPage` page frame
 * (`@automattic/jetpack-components`) plus the route-based tab navigation. Each
 * route's `stage` wraps its screen in this so the header, tabs and footer are
 * identical across Overview / Settings / AI. The shell (nav included) is part of
 * each route's stage, so it re-renders on navigation rather than persisting
 * beneath a swapped panel.
 *
 * @param props            - Component props.
 * @param props.active     - The active tab for the current route.
 * @param props.showFooter - Whether to render the Jetpack footer (default true).
 * @param props.flush      - Render content with no page padding (default false).
 * @param props.children   - The route's screen content.
 * @return The SEO dashboard page chrome.
 */
const DashboardPage = ( { active, showFooter = true, flush = false, children }: Props ) => (
	<ThemeProvider>
		<AdminPage
			title="SEO"
			subTitle={ __(
				'Visibility tools for your site — sitemaps, search-engine settings, and more, in one place.',
				'jetpack-seo'
			) }
			showFooter={ showFooter }
		>
			<DashboardNav active={ active }>
				<div
					className={ `jetpack-seo-page-content${
						flush ? ' jetpack-seo-page-content--flush' : ''
					}` }
				>
					{ children }
				</div>
			</DashboardNav>
		</AdminPage>
	</ThemeProvider>
);

export default DashboardPage;
