import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import ErrorBoundary from './error-boundary';
import { usePodcastSettings, useUpdatePodcastSettings } from './hooks/use-podcast-settings';
import './style.scss';
import type { TabName } from './types';

const Welcome = lazy( () => import( './welcome' ) );
const SettingsTab = lazy( () => import( './settings' ) );
const EpisodesTab = lazy( () => import( './episodes' ) );
const DistributionTab = lazy( () => import( './distribution' ) );

const TabFallback = () => (
	<div className="podcast__loading">
		<Spinner />
	</div>
);

const VALID_TABS: readonly TabName[] = [ 'settings', 'episodes', 'distribution' ];

const isValidTab = ( value: unknown ): value is TabName =>
	typeof value === 'string' && ( VALID_TABS as readonly string[] ).includes( value );

const PAGE_TITLE = 'Podcast'; /* product name; not translated */
const PAGE_SUBTITLE = __(
	'Publish a podcast and reach your fans, anywhere they listen.',
	'jetpack-podcast'
);

type StageSearch = Record< string, unknown > & { tab?: string };

const App = () => {
	const { data: settings, isLoading } = usePodcastSettings();
	const { mutate: saveSettings } = useUpdatePodcastSettings();
	const isSetUp = !! settings && settings.podcasting_category_id > 0;

	// `?tab=` owns the active tab; default (no `tab`) is Settings.
	const search = useSearch( { from: '/' as unknown as never, strict: false } ) as StageSearch;
	const activeTab: TabName = isValidTab( search.tab ) ? search.tab : 'settings';

	// A `?tab=` deep link opts past the Welcome gate.
	const [ hasEnabled, setHasEnabled ] = useState( () => isValidTab( search.tab ) );
	const showWelcome = ! isSetUp && ! hasEnabled;

	const navigate = useNavigate();

	const handleTabChange = useCallback(
		( next: string | null ) => {
			if ( ! isValidTab( next ) ) {
				return;
			}
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					// Default tab keeps a clean URL.
					tab: next === 'settings' ? undefined : next,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	// Mirrors the legacy /podcasting toggle: pre-fills the title from the site
	// name on first enable, then jumps to Settings.
	const handleEnable = useCallback( () => {
		const currentTitle = settings?.podcasting_title ?? '';
		if ( ! currentTitle ) {
			const siteName = getSiteData()?.title?.trim() ?? '';
			if ( siteName ) {
				saveSettings( { podcasting_title: siteName } );
			}
		}
		setHasEnabled( true );
	}, [ settings?.podcasting_title, saveSettings ] );

	const goToSettings = useCallback( () => {
		handleTabChange( 'settings' );
	}, [ handleTabChange ] );

	if ( isLoading ) {
		return (
			<AdminPage title={ PAGE_TITLE } subTitle={ PAGE_SUBTITLE }>
				<div className="podcast__loading">
					<Spinner />
				</div>
			</AdminPage>
		);
	}

	if ( showWelcome ) {
		return (
			<AdminPage title={ PAGE_TITLE } subTitle={ PAGE_SUBTITLE }>
				<div className="podcast__tab-content podcast__tab-content--wide">
					<ErrorBoundary>
						<Suspense fallback={ <TabFallback /> }>
							<Welcome onEnable={ handleEnable } />
						</Suspense>
					</ErrorBoundary>
				</div>
			</AdminPage>
		);
	}

	return (
		<AdminPage title={ PAGE_TITLE } subTitle={ PAGE_SUBTITLE }>
			<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
				<div className="jp-admin-page-tabs">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-podcast' ) }</Tabs.Tab>
						<Tabs.Tab value="episodes" disabled={ ! isSetUp }>
							{ __( 'Episodes', 'jetpack-podcast' ) }
						</Tabs.Tab>
						<Tabs.Tab value="distribution" disabled={ ! isSetUp }>
							{ __( 'Distribution', 'jetpack-podcast' ) }
						</Tabs.Tab>
					</Tabs.List>
				</div>
				<Tabs.Panel value="settings">
					<div className="podcast__tab-content podcast__tab-content--narrow">
						<ErrorBoundary>
							<Suspense fallback={ <TabFallback /> }>
								<SettingsTab />
							</Suspense>
						</ErrorBoundary>
					</div>
				</Tabs.Panel>
				<Tabs.Panel value="episodes">
					<div className="podcast__tab-content">
						<ErrorBoundary>
							<Suspense fallback={ <TabFallback /> }>
								<EpisodesTab />
							</Suspense>
						</ErrorBoundary>
					</div>
				</Tabs.Panel>
				<Tabs.Panel value="distribution">
					<div className="podcast__tab-content podcast__tab-content--narrow">
						<ErrorBoundary>
							<Suspense fallback={ <TabFallback /> }>
								<DistributionTab onEditSettings={ goToSettings } />
							</Suspense>
						</ErrorBoundary>
					</div>
				</Tabs.Panel>
			</Tabs.Root>
		</AdminPage>
	);
};

export default App;
