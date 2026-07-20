import analytics from '@automattic/jetpack-analytics';
import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import { Button, Tabs } from '@wordpress/ui';
import OverviewTab from '../../_inc/components/overview-tab';
import SettingsTab from '../../_inc/components/settings-tab';
import { TurnOnSocialProvider } from '../../_inc/components/settings-tab/turn-on-social-context';
import SocialPage, { type SocialTab } from '../../_inc/components/social-page';
import { store as socialStore } from '../../_inc/social-store';
import { canToggleSocialModule } from '../../_inc/utils/misc';

type StageSearch = Record< string, unknown > & {
	tab?: string;
};

// One client per page load; downstream route PRs will lift this to a shared
// module so other routes/inspectors hit the same cache.
const queryClient = new QueryClient();

/**
 * "Add account" action rendered into the Page header on the Overview
 * tab. Dispatches `openConnectionsModal` so the existing
 * `ManageConnectionsModal` (rendered inside `ConnectionManagement`)
 * takes over from there.
 *
 * @return The page-header action button.
 */
const AddAccountAction = () => {
	const { openConnectionsModal } = useDispatch( socialStore );
	return (
		<Button variant="solid" size="compact" onClick={ openConnectionsModal }>
			{ __( 'Add account', 'jetpack-publicize-pkg' ) }
		</Button>
	);
};

/**
 * Single stage that owns the unified Social page chrome — Page header,
 * tab nav, and one `Tabs.Root` that persists across tab changes so the
 * active-tab indicator slides between Overview and Settings instead of
 * remounting on each route hop.
 *
 * When the site is disconnected, or on the free plan with the pricing
 * nudge not yet dismissed, the client-side `SocialGate` (rendered inside
 * `SocialPage`) shows the connection or pricing gate in place of these
 * tabs — so the modernized dashboard handles those states itself instead
 * of falling back to the legacy admin page.
 *
 * @return Stage content.
 */
const Stage = () => {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as StageSearch;

	// Non-admins can't read stats or change settings, so the page collapses to
	// the Overview (connection-management) surface — `SocialPage` drops the tab
	// chrome for them, and we ignore any stale `?tab=settings` left in the URL.
	const canManageOptions = currentUserCan( 'manage_options' );

	// When Social is off and this user can turn it on, there are no connections
	// to manage — so collapse to the Settings tab (which hosts the turn-on
	// surface), hide the Overview tab, and drop the "Add account" action. Keeps
	// the user off a dead Overview and out of the enable → Overview → "Add
	// account points to the editor" friction loop.
	const isModuleActive = useSelect(
		select => select( socialStore ).getSocialModuleSettings().publicize,
		[]
	);

	// `turnOn` latches `isEnabling` until the reload. We keep the page collapsed
	// while enabling (`|| isEnabling`) even though the store flips the module on
	// optimistically — otherwise the dashboard would flash the enabled tabs
	// during the save, right before reloading. On enable we reload so the tabs,
	// connection list and settings hydrate; the reload lands on Overview.
	const { updateSocialModuleSettings } = useDispatch( socialStore );
	const [ isEnabling, setIsEnabling ] = useState( false );
	const turnOn = useCallback( async () => {
		setIsEnabling( true );
		await updateSocialModuleSettings( { publicize: true } );
		// `saveEntityRecord` (jetpack/v4) resolves even on API error rather than
		// throwing, so we always reload here; a failed enable just reloads back
		// onto this turn-on surface. Surfacing the error is a follow-up.
		window.location.reload();
	}, [ updateSocialModuleSettings ] );

	const socialOff = canToggleSocialModule() && ( ! isModuleActive || isEnabling );

	const activeTab: SocialTab =
		socialOff || ( canManageOptions && search.tab === 'settings' ) ? 'settings' : 'overview';

	const actions = activeTab === 'overview' ? <AddAccountAction /> : null;

	// Initialize analytics once per mount so subsequent `recordEvent` calls
	// queue with a user identity attached. Mirrors the Newsletter chassis.
	useEffect( () => {
		const wpcomUser = getScriptData()?.user?.current_user?.wpcom;
		if ( wpcomUser?.ID && wpcomUser?.login ) {
			analytics.initialize( wpcomUser.ID, wpcomUser.login );
		}
	}, [] );

	// Record a tab-view event on initial mount and whenever the active tab
	// changes. The `lastTrackedTab` ref dedupes React 18 StrictMode's
	// dev-only mount/cleanup/remount cycle — refs persist across the
	// simulated remount, so the second setup invocation finds the current
	// tab already recorded and bails out. Production sees one fire per tab
	// change either way.
	const lastTrackedTab = useRef< SocialTab | null >( null );
	useEffect( () => {
		if ( lastTrackedTab.current === activeTab ) {
			return;
		}
		lastTrackedTab.current = activeTab;
		analytics.tracks.recordEvent( 'jetpack_social_tab_view', { tab: activeTab } );
	}, [ activeTab ] );

	// Social off → the lone turn-on surface; admins → the two tab panels;
	// non-admins → the bare Overview (connection management) the shell hands us.
	let content;
	if ( socialOff ) {
		content = <SettingsTab />;
	} else if ( canManageOptions ) {
		content = (
			<>
				<Tabs.Panel value="overview">
					{ activeTab === 'overview' ? <OverviewTab /> : null }
				</Tabs.Panel>
				<Tabs.Panel value="settings">
					{ activeTab === 'settings' ? <SettingsTab /> : null }
				</Tabs.Panel>
			</>
		);
	} else {
		content = <OverviewTab />;
	}

	return (
		<QueryClientProvider client={ queryClient }>
			<TurnOnSocialProvider value={ { isEnabling, turnOn } }>
				<SocialPage activeTab={ activeTab } actions={ actions } hideTabs={ socialOff }>
					{ content }
				</SocialPage>
			</TurnOnSocialProvider>
		</QueryClientProvider>
	);
};

export { Stage as stage };
