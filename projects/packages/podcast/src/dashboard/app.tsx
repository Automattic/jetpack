/**
 * Jetpack Podcast top-level app: AdminPage chrome + tab navigation.
 */

import { AdminPage, Container, Col, GlobalNotices } from '@automattic/jetpack-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { usePodcastSettings } from './hooks/use-podcast-settings';
import type { TabName } from './types';

// Tabs are lazy-loaded so a visit to the page only pulls down the active tab's
// bundle (and its hooks). DataViews + the Apple Podcasts topics list are the
// two largest chunks; both stay out of the main bundle until needed.
const WelcomeTab = lazy(
	() => import( /* webpackChunkName: "podcast-welcome" */ './tabs/welcome' )
);
const SettingsTab = lazy(
	() => import( /* webpackChunkName: "podcast-settings" */ './tabs/settings' )
);
const EpisodesTab = lazy(
	() => import( /* webpackChunkName: "podcast-episodes" */ './tabs/episodes' )
);
const DistributionTab = lazy(
	() => import( /* webpackChunkName: "podcast-distribution" */ './tabs/distribution' )
);

const TabFallback = () => (
	<div className="podcast__loading">
		<Spinner />
	</div>
);

const VALID_TABS: readonly TabName[] = [ 'welcome', 'settings', 'episodes', 'distribution' ];

const isValidTab = ( value: string | null ): value is TabName =>
	!! value && ( VALID_TABS as readonly string[] ).includes( value );

/**
 * Resolve the initial tab. Order of preference: URL hash (e.g. `#episodes`)
 * so deep links and reloads stick; `welcome` if podcasting isn't set up yet;
 * `settings` once a category is configured (matches Calypso's onboarding flow).
 *
 * @param isSetUp - Whether the site already has a podcast category configured.
 * @return          The tab to land on.
 */
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
	const isSetUp = !! settings && settings.podcasting_category_id > 0;

	const [ activeTab, setActiveTab ] = useState< TabName >( () => resolveInitialTab( false ) );

	// Settle the default tab once data resolves — `welcome` for new users,
	// `settings` for sites already configured. Skipped if the URL hash already
	// pinned a tab.
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

	// Mirror the active tab to the URL hash for deep links and reload-stickiness.
	useEffect( () => {
		const next = `#${ activeTab }`;
		if ( window.location.hash !== next ) {
			window.history.replaceState( null, '', next );
		}
	}, [ activeTab ] );

	// React to back/forward navigation between tabs.
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
		<AdminPage
			title={ __( 'Podcast', 'jetpack-podcast' ) }
			subTitle={ __(
				'Publish a podcast and reach your fans, anywhere they listen.',
				'jetpack-podcast'
			) }
			showFooter={ false }
			showBackground={ false }
		>
			<GlobalNotices />
			<Container horizontalSpacing={ 0 }>
				<Col>
					{ isLoading ? (
						<div className="podcast__loading">
							<Spinner />
						</div>
					) : (
						<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
							<div className="podcast__tabs-bar">
								<Tabs.List className="podcast__tabs">
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
						</Tabs.Root>
					) }
				</Col>
			</Container>
		</AdminPage>
	);
};

const App = () => (
	<QueryClientProvider client={ queryClient }>
		<PodcastApp />
	</QueryClientProvider>
);

export default App;
