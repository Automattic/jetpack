import analytics from '@automattic/jetpack-analytics';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { getSiteData, getSiteType, isSimpleSite } from '@automattic/jetpack-script-data';
import { QueryClientProvider } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import NewsletterPage, { type NewsletterTab } from '../../_inc/components/newsletter-page';
import ConnectionGate from '../../_inc/subscribers/components/connection-gate';
import SubscribersBody from '../../_inc/subscribers/components/subscribers-body';
import { queryClient } from '../../_inc/subscribers/lib/query-client';
import { NewsletterSettingsBody } from '../../src/settings/newsletter-settings';
import { getNewsletterScriptData } from '../../src/settings/script-data';
import '../../src/settings/style.scss';
import './route.scss';

type StageSearch = Record< string, unknown > & {
	tab?: string;
};

const NEWSLETTER_ADMIN_PAGE = 'admin.php?page=jetpack-newsletter';

/**
 * After connecting, return the visitor to the Newsletter dashboard.
 *
 * @return The absolute Newsletter admin URL, or undefined when the admin URL isn't in script data (e.g. tests).
 */
function getRedirectUri(): string | undefined {
	const adminUrl = getSiteData()?.admin_url;
	return adminUrl ? `${ adminUrl }${ NEWSLETTER_ADMIN_PAGE }` : undefined;
}

/**
 * Single stage that owns the unified Newsletter page chrome — Page header,
 * tab nav, and one `Tabs.Root` that persists across tab changes so the
 * active-tab indicator slides between Subscribers and Settings instead of
 * remounting on each route hop.
 *
 * Active tab is read from `?tab=`. Subscribers is the default; settings
 * loads on `?tab=settings`. The inactive panel stays empty so we don't pay
 * for the other view's data fetching until the user opens it.
 *
 * @return Stage content.
 */
const Stage = () => {
	const search = useSearch( {
		from: '/' as unknown as never,
		strict: false,
	} ) as StageSearch;

	// When `jetpack_wp_admin_subscriber_management_enabled` is filtered to
	// false on the server, the page is Settings-only — pin `activeTab`
	// there so we never try to render the Subscribers body.
	const subscribersEnabled = getNewsletterScriptData()?.subscriberManagementEnabled !== false;
	let activeTab: NewsletterTab = 'subscribers';
	if ( ! subscribersEnabled || search.tab === 'settings' ) {
		activeTab = 'settings';
	}

	const {
		isRegistered,
		hasConnectedOwner,
		isUserConnected,
		siteIsRegistering,
		userIsConnecting,
		handleRegisterSite,
	} = useConnection( {
		from: 'jetpack-newsletter',
		redirectUri: getRedirectUri(),
	} );

	// Subscriber management proxies to WP.com signed as the current user, so a
	// fully connected site AND user are required. Mirrors the VideoPress gate.
	// Simple sites are already hosted on WP.com — they never have a Jetpack
	// connection, and the `/wpcom/v2/subscribers/*` endpoints resolve directly
	// to WP.com authenticated by the logged-in user — so the gate never applies.
	const canManageSubscribers =
		isSimpleSite() || ( isRegistered && hasConnectedOwner && isUserConnected );

	// `handleRegisterSite` registers the site if needed and then connects the
	// user; on an already-registered site it connects the user directly.
	const handleConnect = useCallback( () => {
		handleRegisterSite();
	}, [ handleRegisterSite ] );

	// Initialize analytics once for the entire page so future tab/section
	// events fire regardless of which tab a visitor lands on. Mirrors the
	// initialization that lived in the legacy `NewsletterSettingsApp`.
	useEffect( () => {
		const tracksUserData = getNewsletterScriptData()?.tracksUserData;
		if ( tracksUserData && typeof tracksUserData === 'object' ) {
			analytics.initialize( tracksUserData.userid, tracksUserData.username );
		}
	}, [] );

	// Record a tab-view event on initial mount and whenever the active tab
	// changes. The `lastTrackedTab` ref dedupes React 18 StrictMode's
	// dev-only mount/cleanup/remount cycle — refs persist across the
	// simulated remount, so the second setup invocation finds the current
	// tab already recorded and bails out. Lives here (not in
	// `NewsletterPage.onTabChange`) so it also fires on first page render,
	// not just on user-initiated tab clicks.
	const lastTrackedTab = useRef< NewsletterTab | null >( null );
	useEffect( () => {
		if ( lastTrackedTab.current === activeTab ) {
			return;
		}
		lastTrackedTab.current = activeTab;
		analytics.tracks.recordEvent( 'jetpack_newsletter_tab_view', {
			site_type: getSiteType(),
			tab: activeTab,
		} );
	}, [ activeTab ] );

	return (
		<QueryClientProvider client={ queryClient }>
			<SubscribersBody>
				{ ( { body, actions } ) => {
					// Gate the Subscribers tab: connected visitors get the data view,
					// everyone else gets the connect prompt.
					const subscribersPanel = canManageSubscribers ? (
						body
					) : (
						<ConnectionGate
							onConnect={ handleConnect }
							isConnecting={ siteIsRegistering || userIsConnecting }
						/>
					);

					return (
						<NewsletterPage
							activeTab={ activeTab }
							actions={ activeTab === 'subscribers' && canManageSubscribers ? actions : undefined }
							contentHasPadding={ activeTab === 'settings' }
							hideFooter={ activeTab === 'subscribers' }
						>
							{ subscribersEnabled ? (
								<>
									<Tabs.Panel value="subscribers">
										{ activeTab === 'subscribers' ? subscribersPanel : null }
									</Tabs.Panel>
									<Tabs.Panel value="settings">
										{ activeTab === 'settings' ? <NewsletterSettingsBody isModernized /> : null }
									</Tabs.Panel>
								</>
							) : (
								<NewsletterSettingsBody isModernized />
							) }
						</NewsletterPage>
					);
				} }
			</SubscribersBody>
		</QueryClientProvider>
	);
};

export { Stage as stage };
