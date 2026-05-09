import AdminPage from '@automattic/jetpack-components/admin-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { usePodcastSettings } from './hooks/use-podcast-settings';
import { getPodcastScriptData } from './script-data';
import './style.scss';
import type { TabName } from './types';

const WelcomeTab = lazy( () => import( './welcome' ) );
const SettingsTab = lazy( () => import( './settings' ) );
const EpisodesTab = lazy( () => import( './episodes' ) );
const DistributionTab = lazy( () => import( './distribution' ) );

const TabFallback = () => (
	<div className="podcast__loading">
		<Spinner />
	</div>
);

const VALID_TABS: readonly TabName[] = [ 'welcome', 'settings', 'episodes', 'distribution' ];

const isValidTab = ( value: string | null ): value is TabName =>
	!! value && ( VALID_TABS as readonly string[] ).includes( value );

const resolveInitialTab = ( isSetUp: boolean ): TabName => {
	const hash = typeof window !== 'undefined' ? window.location.hash.replace( /^#/, '' ) : '';
	if ( isValidTab( hash ) ) {
		return hash;
	}
	return isSetUp ? 'settings' : 'welcome';
};

const queryClient = new QueryClient( {
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 30_000,
		},
	},
} );

const PodcastApp = () => {
	const { data: settings, isLoading } = usePodcastSettings();
	// scriptData.categoryId resolves the legacy `podcasting_archive` slug to a
	// term id in PHP. Sites pre-dating `podcasting_category_id` only have the
	// slug — without this fallback they'd land on Welcome despite being set up.
	const scriptData = getPodcastScriptData();
	const isSetUp =
		( !! settings && settings.podcasting_category_id > 0 ) || scriptData.categoryId > 0;

	const [ activeTab, setActiveTab ] = useState< TabName >( () => resolveInitialTab( false ) );

	useEffect( () => {
		if ( isLoading ) {
			return;
		}
		const hash = window.location.hash.replace( /^#/, '' );
		if ( isValidTab( hash ) ) {
			return;
		}
		setActiveTab( isSetUp ? 'settings' : 'welcome' );
	}, [ isLoading, isSetUp ] );

	useEffect( () => {
		const next = `#${ activeTab }`;
		if ( window.location.hash !== next ) {
			window.history.replaceState( null, '', next );
		}
	}, [ activeTab ] );

	useEffect( () => {
		const onHashChange = () => {
			const hash = window.location.hash.replace( /^#/, '' );
			if ( isValidTab( hash ) ) {
				setActiveTab( hash );
			}
		};
		window.addEventListener( 'hashchange', onHashChange );
		return () => window.removeEventListener( 'hashchange', onHashChange );
	}, [] );

	const handleTabChange = useCallback( ( value: string | null ) => {
		if ( isValidTab( value ) ) {
			setActiveTab( value );
		}
	}, [] );

	const handleWelcomeGetStarted = useCallback( () => {
		setActiveTab( 'settings' );
	}, [] );

	return (
		<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
			<AdminPage
				/* "Podcast" is a product name, do not translate. */
				title="Podcast"
				subTitle={ __(
					'Publish a podcast and reach your fans, anywhere they listen.',
					'jetpack-podcast'
				) }
				tabs={
					<div className="jp-admin-page-tabs">
						<Tabs.List variant="minimal">
							<Tabs.Tab value="welcome">{ __( 'Welcome', 'jetpack-podcast' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-podcast' ) }</Tabs.Tab>
							<Tabs.Tab value="episodes" disabled={ ! isSetUp }>
								{ __( 'Episodes', 'jetpack-podcast' ) }
							</Tabs.Tab>
							<Tabs.Tab value="distribution" disabled={ ! isSetUp }>
								{ __( 'Distribution', 'jetpack-podcast' ) }
							</Tabs.Tab>
						</Tabs.List>
					</div>
				}
			>
				{ isLoading ? (
					<div className="podcast__loading">
						<Spinner />
					</div>
				) : (
					<>
						<Tabs.Panel value="welcome">
							<div className="podcast__tab-content">
								<Suspense fallback={ <TabFallback /> }>
									<WelcomeTab onGetStarted={ handleWelcomeGetStarted } />
								</Suspense>
							</div>
						</Tabs.Panel>
						<Tabs.Panel value="settings">
							<div className="podcast__tab-content">
								<Suspense fallback={ <TabFallback /> }>
									<SettingsTab />
								</Suspense>
							</div>
						</Tabs.Panel>
						<Tabs.Panel value="episodes">
							<div className="podcast__tab-content">
								<Suspense fallback={ <TabFallback /> }>
									<EpisodesTab />
								</Suspense>
							</div>
						</Tabs.Panel>
						<Tabs.Panel value="distribution">
							<div className="podcast__tab-content">
								<Suspense fallback={ <TabFallback /> }>
									<DistributionTab />
								</Suspense>
							</div>
						</Tabs.Panel>
					</>
				) }
			</AdminPage>
		</Tabs.Root>
	);
};

const App = () => (
	<QueryClientProvider client={ queryClient }>
		<PodcastApp />
	</QueryClientProvider>
);

export default App;
