import AdminPage from '@automattic/jetpack-components/admin-page';
import { Spinner } from '@wordpress/components';
import { lazy, Suspense, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { usePodcastSettings } from './hooks/use-podcast-settings';
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

const isValidTab = ( value: string | null ): value is TabName =>
	!! value && ( VALID_TABS as readonly string[] ).includes( value );

const PAGE_TITLE = 'Podcast'; /* product name; not translated */
const PAGE_SUBTITLE = __(
	'Publish a podcast and reach your fans, anywhere they listen.',
	'jetpack-podcast'
);

const App = () => {
	const { data: settings, isLoading } = usePodcastSettings();
	const isSetUp = !! settings && settings.podcasting_category_id > 0;
	// A user landing with a valid tab hash has already opted past the gateway,
	// so we honor the deep link instead of bouncing them to Welcome.
	const initialHash = isValidTab( window.location.hash.replace( /^#/, '' ) );
	const [ hasEnabled, setHasEnabled ] = useState( initialHash );
	const showWelcome = ! isSetUp && ! hasEnabled;

	const [ activeTab, setActiveTab ] = useState< TabName >( () => {
		const hash = window.location.hash.replace( /^#/, '' );
		return isValidTab( hash ) ? hash : 'settings';
	} );

	useEffect( () => {
		if ( showWelcome ) {
			return;
		}
		const next = `#${ activeTab }`;
		if ( window.location.hash !== next ) {
			window.history.replaceState( null, '', next );
		}
	}, [ activeTab, showWelcome ] );

	useEffect( () => {
		const onHashChange = () => {
			const hash = window.location.hash.replace( /^#/, '' );
			if ( isValidTab( hash ) ) {
				setActiveTab( hash );
				setHasEnabled( true );
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

	const handleEnable = useCallback( () => {
		setHasEnabled( true );
		setActiveTab( 'settings' );
	}, [] );

	const goToSettings = useCallback( () => {
		setActiveTab( 'settings' );
	}, [] );

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
				<Suspense fallback={ <TabFallback /> }>
					<Welcome onEnable={ handleEnable } />
				</Suspense>
			</AdminPage>
		);
	}

	return (
		<Tabs.Root value={ activeTab } onValueChange={ handleTabChange }>
			<AdminPage
				title={ PAGE_TITLE }
				subTitle={ PAGE_SUBTITLE }
				tabs={
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
				}
			>
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
							<DistributionTab onEditSettings={ goToSettings } />
						</Suspense>
					</div>
				</Tabs.Panel>
			</AdminPage>
		</Tabs.Root>
	);
};

export default App;
