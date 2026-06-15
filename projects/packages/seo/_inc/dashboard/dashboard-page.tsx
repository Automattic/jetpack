import { AdminPage, ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import DashboardNav from './dashboard-nav';
import '../admin-page-layout.scss';
import type { SeoTab } from './dashboard-nav';
import type { ReactNode } from 'react';

interface Props {
	/** The tab for the currently rendered route (drives the active nav state). */
	active: SeoTab;
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
 * @param props          - Component props.
 * @param props.active   - The active tab for the current route.
 * @param props.children - The route's screen content.
 * @return The SEO dashboard page chrome.
 */
const DashboardPage = ( { active, children }: Props ) => (
	<ThemeProvider>
		<AdminPage
			title="SEO"
			subTitle={ __(
				'Visibility tools for your site — sitemaps, search-engine settings, and more, in one place.',
				'jetpack-seo'
			) }
			showFooter
		>
			<DashboardNav active={ active } />
			<div className="jetpack-seo-page-content">{ children }</div>
		</AdminPage>
	</ThemeProvider>
);

export default DashboardPage;
