import { AdminPage, ThemeProvider } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import getOverview from './data/get-overview';
import { useSettingsForm } from './data/use-settings';
import NoticesList from './notices-list';
import OverviewScreen from './screens/overview';
import SettingsScreen from './screens/settings';
import './admin-page-layout.scss';
import type { FC } from 'react';

type StageSearch = Record< string, unknown > & { tab?: string };
type SeoTab = 'overview' | 'settings';

/**
 * Root of the Jetpack SEO admin app, mounted by `@wordpress/build` as the
 * route's `stage`. Renders the shared `AdminPage` chrome and an Overview /
 * Settings tab pair driven by `?tab=`. The Settings form state lives here
 * (above the tab panels) so unsaved edits survive switching tabs.
 *
 * @return The Jetpack SEO admin page.
 */
const App: FC = () => {
	const search = useSearch( { from: '/' as unknown as never, strict: false } ) as StageSearch;
	const activeTab: SeoTab = search.tab === 'settings' ? 'settings' : 'overview';
	const navigate = useNavigate();
	const settingsForm = useSettingsForm();

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'overview' && next !== 'settings' ) {
				return;
			}
			navigate( {
				// Default tab keeps a clean URL (no `?tab=overview`).
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					tab: next === 'overview' ? undefined : next,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	// While the `seo-tools` module is off, the server registers only the menu
	// and app shell (not the settings surface), so the page is purely a
	// discovery/enable surface: render the Overview alone, with no tab bar.
	const seoToolsActive = getOverview()?.site_visibility.seo_tools_active ?? false;

	return (
		<ThemeProvider>
			<AdminPage
				title="SEO"
				subTitle={ __(
					'Visibility tools for your site — sitemaps, search-engine settings, and more, in one place.',
					'jetpack-seo'
				) }
				showFooter
			>
				{ seoToolsActive ? (
					<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
						<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
							<Tabs.List variant="minimal">
								<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-seo' ) }</Tabs.Tab>
								<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-seo' ) }</Tabs.Tab>
							</Tabs.List>
						</div>
						<Tabs.Panel value="overview" focusable={ false }>
							<div className="jetpack-seo-page-content">
								<OverviewScreen />
							</div>
						</Tabs.Panel>
						<Tabs.Panel value="settings" focusable={ false }>
							<div className="jetpack-seo-page-content">
								<SettingsScreen form={ settingsForm } />
							</div>
						</Tabs.Panel>
					</Tabs.Root>
				) : (
					<div className="jetpack-seo-page-content">
						<OverviewScreen />
					</div>
				) }
				<NoticesList />
			</AdminPage>
		</ThemeProvider>
	);
};

export default App;
