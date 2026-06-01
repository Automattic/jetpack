import { AdminPage, ThemeProvider } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import OverviewScreen from './screens/overview';
import './admin-page-layout.scss';
import type { FC } from 'react';

/**
 * Root of the Jetpack SEO admin app.
 *
 * `@wordpress/build` mounts this as the route's `stage`. It renders the shared
 * `AdminPage` chrome (header + footer) and the Overview screen. The screen
 * reads its data synchronously from the page bootstrap (`window.JetpackScriptData`),
 * so there's no router or async provider to set up here yet — tabs arrive in
 * later PRs.
 *
 * @return The Jetpack SEO admin page.
 */
const App: FC = () => (
	<ThemeProvider>
		<AdminPage
			title={ __( 'SEO', 'jetpack-seo' ) }
			subTitle={ __(
				'Visibility tools for your site — sitemaps, canonical URLs, and search-engine settings, in one place.',
				'jetpack-seo'
			) }
			showFooter
		>
			<div className="jetpack-seo-page-content">
				<OverviewScreen />
			</div>
		</AdminPage>
	</ThemeProvider>
);

export default App;
