import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import ErrorBoundary from './error-boundary';
import { usePodcastSettings } from './hooks/use-podcast-settings';
import './style.scss';
import type { TabName } from './types';

const Welcome = lazy( () => import( './welcome' ) );
const CategorySetupModal = lazy( () => import( './welcome/category-setup-modal' ) );
const SettingsTab = lazy( () => import( './settings' ) );
const EpisodesTab = lazy( () => import( './episodes' ) );
const DistributionTab = lazy( () => import( './distribution' ) );
const StatsTab = lazy( () => import( './stats' ) );

const TabFallback = () => (
	<div className="podcast__loading">
		<Spinner />
	</div>
);

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

	// `?tab=` owns the active tab; absent `?tab=` falls back to `defaultTab`.
	const search = useSearch( { from: '/' as unknown as never, strict: false } ) as StageSearch;

	// A `?tab=` deep link opts past the Welcome gate.
	const [ hasEnabled, setHasEnabled ] = useState( () => isValidTab( search.tab ) );
	const [ setupModalOpen, setSetupModalOpen ] = useState( false );
	const showWelcome = ! isSetUp && ! hasEnabled;

	// Stats/Episodes/Distribution are disabled until a category is picked, so the
	// pre-set-up default has to be Settings. Returning, set-up users land on Stats.
	const defaultTab: TabName = isSetUp ? 'stats' : 'settings';

	// Pre-setup, only Settings is usable; a `?tab=stats` deep link must not land
	// a keyboard user on a panel whose own tab is rendered disabled.
	const isTabAvailable = ( name: TabName ): boolean => isSetUp || name === 'settings';

	const requestedTab: TabName | null = isValidTab( search.tab ) ? search.tab : null;
	const activeTab: TabName =
		requestedTab && isTabAvailable( requestedTab ) ? requestedTab : defaultTab;

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
					tab: next === defaultTab ? undefined : next,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate, defaultTab ]
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

	const handleSetupSuccess = useCallback( () => {
		setSetupModalOpen( false );
		setHasEnabled( true );
		focusActiveTabOnNextRender.current = true;
		navigate( {
			search: ( prev: Record< string, unknown > ) => ( {
				...prev,
				tab: 'settings',
			} ),
		} as unknown as Parameters< typeof navigate >[ 0 ] );
	}, [ navigate ] );

	// Modal close + Welcome unmount drops keyboard focus to document.body.
	// Move it onto the newly-mounted Settings tab once the tablist renders.
	useEffect( () => {
		if ( ! focusActiveTabOnNextRender.current || showWelcome ) {
			return;
		}
		focusActiveTabOnNextRender.current = false;
		const tab = document.querySelector< HTMLElement >(
			'[role="tab"][aria-selected="true"]'
		);
		tab?.focus();
	}, [ showWelcome ] );

	const goToSettings = useCallback( () => {
		handleTabChange( 'settings' );
	}, [ handleTabChange ] );

	// On disable, drop the stale `?tab=` so a reload doesn't bypass Welcome
	// via the deep-link gate.
	const handleAfterDisable = useCallback( () => {
		setHasEnabled( false );
		navigate( {
			search: ( prev: Record< string, unknown > ) => ( {
				...prev,
				tab: undefined,
			} ),
		} as unknown as Parameters< typeof navigate >[ 0 ] );
	}, [ navigate ] );

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
							<Welcome onEnable={ handleEnable } />
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

	return (
		<AdminPage title={ PAGE_TITLE } subTitle={ PAGE_SUBTITLE }>
			<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
				<div className="jp-admin-page-tabs">
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
								<StatsTab />
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
