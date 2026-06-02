import { AdminPage, ThemeProvider } from '@automattic/jetpack-components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import getOverview from './data/get-overview';
import { useSettingsForm } from './data/use-settings';
import ContentScreen from './screens/content';
import OverviewScreen from './screens/overview';
import SettingsScreen from './screens/settings';
import './admin-page-layout.scss';
import type { CoverageDelta } from './data/content-types';
import type { ContentCoverage } from './data/overview-types';
import type { FC } from 'react';

type StageSearch = Record< string, unknown > & { tab?: string };
type SeoTab = 'overview' | 'settings' | 'content';

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
	const activeTab: SeoTab =
		search.tab === 'settings' || search.tab === 'content' ? search.tab : 'overview';
	const navigate = useNavigate();
	const settingsForm = useSettingsForm();

	// Coverage counts live here (above the tabs) so a Content-tab edit reflects
	// on the Overview card immediately on tab switch, without a reload. Seeded
	// from the server bootstrap; nudged optimistically when a post's SEO saves.
	const [ coverage, setCoverage ] = useState< ContentCoverage | null >(
		() => getOverview()?.content_coverage ?? null
	);

	const onContentSaved = useCallback(
		( delta: CoverageDelta ) =>
			setCoverage( current =>
				current
					? {
							...current,
							with_description: current.with_description + delta.description,
							with_schema: current.with_schema + delta.schema,
					  }
					: current
			),
		[]
	);

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'overview' && next !== 'settings' && next !== 'content' ) {
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
				<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
					<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
						<Tabs.List variant="minimal">
							<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-seo' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-seo' ) }</Tabs.Tab>
							<Tabs.Tab value="content">{ __( 'Content', 'jetpack-seo' ) }</Tabs.Tab>
						</Tabs.List>
					</div>
					<Tabs.Panel value="overview" focusable={ false }>
						<div className="jetpack-seo-page-content">
							<OverviewScreen coverage={ coverage } />
						</div>
					</Tabs.Panel>
					<Tabs.Panel value="settings" focusable={ false }>
						<div className="jetpack-seo-page-content">
							<SettingsScreen form={ settingsForm } />
						</div>
					</Tabs.Panel>
					<Tabs.Panel value="content" focusable={ false }>
						<div className="jetpack-seo-page-content">
							<ContentScreen onSaved={ onContentSaved } />
						</div>
					</Tabs.Panel>
				</Tabs.Root>
			</AdminPage>
		</ThemeProvider>
	);
};

export default App;
