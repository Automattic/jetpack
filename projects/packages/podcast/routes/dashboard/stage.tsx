/**
 * Jetpack Podcast SPA stage — AdminPage chrome + tab navigation, mounted by
 * `@wordpress/build` once the wp-admin page is rendered.
 */

import AdminPage from '@automattic/jetpack-components/admin-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { usePodcastSettings } from './hooks/use-podcast-settings';
import './route.scss';
import { getPodcastScriptData } from './script-data';
import type { TabName } from './types';

// Tabs are lazy-loaded so a visit to the page only pulls down the active tab's
// bundle (and its hooks). DataViews + the Apple Podcasts topics list are the
// two largest chunks; both stay out of the main bundle until needed.
const WelcomeTab = lazy( () => import( './tabs/welcome' ) );
const SettingsTab = lazy( () => import( './tabs/settings' ) );
const EpisodesTab = lazy( () => import( './tabs/episodes' ) );
const DistributionTab = lazy( () => import( './tabs/distribution' ) );

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
 * `settings` once a category is configured.
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
	// `scriptData.categoryId` is the resolved id from `Podcast::get_category_id()`
	// in PHP, which falls back to looking up `podcasting_archive` (slug). Sites
	// that pre-date the numeric `podcasting_category_id` option only have the
	// archive slug — without this fallback they'd land on Welcome instead of
	// Episodes despite already being set up.
	const scriptData = getPodcastScriptData();
	const isSetUp =
		( !! settings && settings.podcasting_category_id > 0 ) || scriptData.categoryId > 0;

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

const Stage = () => (
	<QueryClientProvider client={ queryClient }>
		<PodcastApp />
	</QueryClientProvider>
);

export { Stage as stage };
