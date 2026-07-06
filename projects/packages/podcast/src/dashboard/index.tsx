// Side-effect import: registers the apiFetch preload middleware.
import './preload';
import AdminPage from '@automattic/jetpack-components/admin-page';
import { getAdminUrl, getScriptData, getSiteData } from '@automattic/jetpack-script-data';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Button, Tabs } from '@wordpress/ui';
import { isSiteConnected } from './connection';
import ErrorBoundary from './error-boundary';
import { usePodcastSettings } from './hooks/use-podcast-settings';
import './style.scss';
import type { TabName } from './types';
import type { ReactNode } from 'react';

const Welcome = lazy( () => import( './welcome' ) );
const CategorySetupModal = lazy( () => import( './welcome/category-setup-modal' ) );
const SettingsTab = lazy( () => import( './settings' ) );
const EpisodesTab = lazy( () => import( './episodes' ) );
const DistributionTab = lazy( () => import( './distribution' ) );
const StatsTab = lazy( () => import( './stats' ) );
const LockedPreview = lazy( () => import( './locked-preview' ) );
const ConnectPrompt = lazy( () => import( './connect-prompt' ) );

// Fail-open: a missing flag means access-granted, so a deploy race never locks
// grandfathered users out of the Episodes tab.
const hasProductAccess = (): boolean => getScriptData()?.podcast?.has_product_access !== false;

// Fail-closed counterpart for entitlement *claims* (the welcome screen's
// "included with your plan" copy): only treat the site as entitled when the
// flag is explicitly true, so a missing flag never asserts entitlement we
// haven't confirmed or hides the upgrade path from a non-entitled user.
const hasConfirmedProductAccess = (): boolean =>
	getScriptData()?.podcast?.has_product_access === true;

const TabFallback = () => (
	<div className="podcast__loading">
		<Spinner />
	</div>
);

const GatedTab = ( {
	connected,
	hasAccess,
	variant,
	children,
}: {
	connected: boolean;
	hasAccess: boolean;
	variant: 'stats' | 'episodes';
	children: ReactNode;
} ) => {
	if ( ! connected ) {
		return <ConnectPrompt variant={ variant } />;
	}
	if ( ! hasAccess ) {
		return <LockedPreview variant={ variant } />;
	}
	return <>{ children }</>;
};

const VALID_TABS: readonly TabName[] = [ 'settings', 'episodes', 'distribution', 'stats' ];

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
	const isSetUp = !! settings && settings.podcasting_category_id > 0;
	const hasAccess = hasProductAccess();
	// Confirmed entitlement gates the welcome "included" claim; the fail-open
	// `hasAccess` keeps gating the tabs so a missing flag never locks anyone out.
	const hasConfirmedAccess = hasConfirmedProductAccess();
	const connected = isSiteConnected();

	// `?tab=` owns the active tab; absent `?tab=` falls back to `defaultTab`.
	const search = useSearch( { from: '/' as unknown as never, strict: false } ) as StageSearch;

	// A `?tab=` deep link opts past the Welcome gate.
	const [ hasEnabled, setHasEnabled ] = useState( () => isValidTab( search.tab ) );
	const [ setupModalOpen, setSetupModalOpen ] = useState( false );
	const showWelcome = ! isSetUp && ! hasEnabled;

	// Stats/Episodes/Distribution are disabled until a category is picked, so the
	// pre-set-up default has to be Settings. Returning, set-up users land on Stats.
	const defaultTab: TabName = isSetUp ? 'stats' : 'settings';

	// Pre-setup, only Settings is usable; ignore deep links to disabled tabs so a
	// keyboard user can't land on a panel whose own tab is rendered disabled.
	const requestedTab: TabName | null = isValidTab( search.tab ) ? search.tab : null;
	const activeTab: TabName =
		requestedTab && ( isSetUp || requestedTab === 'settings' ) ? requestedTab : defaultTab;

	const navigate = useNavigate();

	// `@wordpress/route`'s types don't model the search-updater form; isolate the
	// cast here so callers stay clean.
	const updateSearch = useCallback(
		( updater: ( prev: Record< string, unknown > ) => Record< string, unknown > ) => {
			navigate( { search: updater } as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	const handleTabChange = useCallback(
		( next: string | null ) => {
			if ( ! isValidTab( next ) ) {
				return;
			}
			updateSearch( prev => ( {
				...prev,
				// Default tab keeps a clean URL.
				tab: next === defaultTab ? undefined : next,
			} ) );
		},
		[ updateSearch, defaultTab ]
	);

	const handleEnable = useCallback( () => {
		setSetupModalOpen( true );
	}, [] );

	const handleSetupCancel = useCallback( () => {
		setSetupModalOpen( false );
	}, [] );

	// Modal committed title + category atomically; flip out of Welcome and
	// land the user on Settings to finish the show details. Pin `?tab=settings`
	// explicitly rather than calling handleTabChange; once the settings query
	// refetches and `isSetUp` flips true, the default tab flips to `stats` and
	// a `tab: undefined` URL would bounce the user there before they finish.
	const focusActiveTabOnNextRender = useRef( false );

	const tablistRef = useRef< HTMLDivElement >( null );

	const handleSetupSuccess = useCallback( () => {
		setSetupModalOpen( false );
		setHasEnabled( true );
		focusActiveTabOnNextRender.current = true;
		updateSearch( prev => ( { ...prev, tab: 'settings' } ) );
	}, [ updateSearch ] );

	// Modal close + Welcome unmount drops keyboard focus to document.body.
	// Move it onto the newly-mounted Settings tab once the tablist renders.
	useEffect( () => {
		if ( ! focusActiveTabOnNextRender.current || showWelcome ) {
			return;
		}
		focusActiveTabOnNextRender.current = false;
		tablistRef.current
			?.querySelector< HTMLElement >( '[role="tab"][aria-selected="true"]' )
			?.focus();
	}, [ showWelcome ] );

	const goToSettings = useCallback( () => {
		handleTabChange( 'settings' );
	}, [ handleTabChange ] );

	// On disable, drop the stale `?tab=` so a reload doesn't bypass Welcome
	// via the deep-link gate.
	const handleAfterDisable = useCallback( () => {
		setHasEnabled( false );
		updateSearch( prev => ( { ...prev, tab: undefined } ) );
	}, [ updateSearch ] );

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
		const siteName = getSiteData()?.title?.trim() ?? '';
		return (
			<AdminPage title={ PAGE_TITLE } subTitle={ PAGE_SUBTITLE }>
				<div className="podcast__tab-content podcast__tab-content--wide">
					<ErrorBoundary>
						<Suspense fallback={ <TabFallback /> }>
							<Welcome onEnable={ handleEnable } hasAccess={ hasConfirmedAccess } />
						</Suspense>
					</ErrorBoundary>
				</div>
				{ setupModalOpen && (
					<Suspense fallback={ null }>
						<CategorySetupModal
							siteName={ siteName }
							existingTitle={ settings?.podcasting_title ?? '' }
							onClose={ handleSetupCancel }
							onSuccess={ handleSetupSuccess }
						/>
					</Suspense>
				) }
			</AdminPage>
		);
	}

	// Same destination + label for every plan; `New_Episode_Prefill` keys off `?podcast_episode=1`.
	const headerActions = isSetUp ? (
		<Button
			size="compact"
			variant="solid"
			render={
				<a
					className="podcast__header-cta"
					href={ getAdminUrl( 'post-new.php?podcast_episode=1' ) }
				/>
			}
		>
			{ __( 'Create episode', 'jetpack-podcast' ) }
		</Button>
	) : undefined;

	return (
		<AdminPage title={ PAGE_TITLE } subTitle={ PAGE_SUBTITLE } actions={ headerActions }>
			<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal" ref={ tablistRef }>
					<Tabs.List variant="minimal">
						<Tabs.Tab value="stats" disabled={ ! isSetUp }>
							{ __( 'Stats', 'jetpack-podcast' ) }
						</Tabs.Tab>
						<Tabs.Tab value="episodes" disabled={ ! isSetUp }>
							{ __( 'Episodes', 'jetpack-podcast' ) }
						</Tabs.Tab>
						<Tabs.Tab value="distribution" disabled={ ! isSetUp }>
							{ __( 'Distribution', 'jetpack-podcast' ) }
						</Tabs.Tab>
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-podcast' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				<Tabs.Panel value="stats">
					<div className="podcast__tab-content podcast__tab-content--xwide">
						<ErrorBoundary>
							<Suspense fallback={ <TabFallback /> }>
								<GatedTab connected={ connected } hasAccess={ hasAccess } variant="stats">
									<StatsTab />
								</GatedTab>
							</Suspense>
						</ErrorBoundary>
					</div>
				</Tabs.Panel>
				<Tabs.Panel value="episodes">
					<div className="podcast__tab-content">
						<ErrorBoundary>
							<Suspense fallback={ <TabFallback /> }>
								<GatedTab connected={ connected } hasAccess={ hasAccess } variant="episodes">
									<EpisodesTab />
								</GatedTab>
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
				<Tabs.Panel value="settings">
					<div className="podcast__tab-content podcast__tab-content--narrow">
						<ErrorBoundary>
							<Suspense fallback={ <TabFallback /> }>
								<SettingsTab onAfterDisable={ handleAfterDisable } />
							</Suspense>
						</ErrorBoundary>
					</div>
				</Tabs.Panel>
			</Tabs.Root>
		</AdminPage>
	);
};

export default App;
