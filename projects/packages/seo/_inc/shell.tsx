import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Outlet } from 'react-router';
import type { FC } from 'react';

/**
 * Top-level chrome for the Jetpack SEO admin page.
 *
 * Renders the shared `AdminPage` (header + footer) from
 * `@automattic/jetpack-components` and lets the router fill the body via
 * `<Outlet>`. `AdminPage` owns the background and content padding, so there
 * are no local layout overrides here.
 *
 * @return {ReactNode} The Jetpack SEO admin page chrome.
 */
const Shell: FC = () => (
	<AdminPage
		title={ __( 'SEO', 'jetpack-seo' ) }
		subTitle={ __(
			'Visibility tools for your site — sitemaps, canonical URLs, and search-engine settings, in one place.',
			'jetpack-seo'
		) }
		showFooter
	>
		<Outlet />
	</AdminPage>
);

export default Shell;
