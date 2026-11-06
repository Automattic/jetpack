/**
 * External dependencies
 */
import CONNECTION_STORE_ID from '@automattic/jetpack-connection/state/store-id';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { navigateTo } from './navigate';

const DASHBOARD_PATH = 'admin.php?page=jetpack-premium-analytics-wp-admin';

/**
 * Names this entry point to WordPress.com, which picks the connection screen and attributes the connection by it.
 */
const CONNECTION_FROM = 'jetpack_premium_analytics_onboarding';

/**
 * Tracks only queues an event, and leaving the page in the same tick cancels the request that sends it.
 */
const TRACKS_FLUSH_DELAY = 250;

export type Plan = 'free' | 'paid' | 'existing';

type Registration = { authorizeUrl?: string };

type ConnectionStatus = { isRegistered?: boolean };

/** What the Jetpack API client rejects with: the REST error's body on `response`, or a named network error. */
type RegistrationError = { name?: string; response?: { code?: string; message?: string } };

/**
 * The blog id WordPress.com just assigned, read off the authorization URL's `client_id`.
 *
 * @param authorizeUrl - The URL registration returned.
 * @return The blog id, or `null` when the URL carries none.
 */
function readBlogId( authorizeUrl: string | undefined ): number | null {
	try {
		const clientId = Number( new URL( authorizeUrl ?? '' ).searchParams.get( 'client_id' ) );

		return Number.isInteger( clientId ) && clientId > 0 ? clientId : null;
	} catch {
		return null;
	}
}

/**
 * Opened with a page load, so the upgrade page reads the blog id registration just assigned.
 */
const UPGRADE_PATH = `${ DASHBOARD_PATH }&p=${ encodeURIComponent( '/upgrade?source=pricing_grid' ) }`;

/**
 * Leave the page once Tracks has had time to send what it queued.
 *
 * @param url - Where to go.
 */
function navigateOnceRecorded( url: string ) {
	setTimeout( () => {
		navigateTo( url );
	}, TRACKS_FLUSH_DELAY );
}

/**
 * The plan choice a site makes before it is connected, and the registration each choice starts.
 *
 * @return The handler, the choice in flight, and the last error.
 */
export function usePlanChoice() {
	const trackEvent = useTrackEvent();
	const [ pendingPlan, setPendingPlan ] = useState< Plan | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	// Also points the connection store's REST client at this site, which `registerSite` relies on.
	const { isOfflineMode } = useConnection( {
		from: CONNECTION_FROM,
		redirectUri: DASHBOARD_PATH,
	} );
	const { registerSite, refreshConnectionStatus } = useDispatch( CONNECTION_STORE_ID ) as {
		registerSite: ( args: { redirectUri: string; from: string } ) => Promise< Registration >;
		refreshConnectionStatus: () => Promise< ConnectionStatus >;
	};

	// Nothing else identifies a site before it registers, and it ties these events to the checkout.
	const siteSuffix = getScriptData()?.site?.suffix ?? '';

	// Leaves `pendingPlan` set on success: the browser is on its way to WordPress.com.
	const choose = useCallback(
		async ( plan: Plan ) => {
			const track = ( name: string, properties: Record< string, unknown > = {} ) =>
				trackEvent( `jetpack_premium_analytics_pre_connection_${ name }`, {
					site_suffix: siteSuffix,
					plan,
					...properties,
				} );

			const fail = ( errorCode: string | undefined, message?: string ) => {
				// The code, not the message: the message arrives translated and can name the site.
				track( 'register_failed', { error_code: errorCode } );
				setError(
					message ||
						__(
							'Jetpack could not connect this site to WordPress.com. Please try again.',
							'jetpack-premium-analytics-pkg'
						)
				);
				setPendingPlan( null );
			};

			setError( null );
			setPendingPlan( plan );
			track( 'register_start' );

			// The page's connection state is from its load; registering a site connected since then deletes that connection's tokens.
			let status: ConnectionStatus;
			try {
				status = await refreshConnectionStatus();
			} catch ( e ) {
				const failure = ( e ?? {} ) as RegistrationError;
				fail( failure.response?.code ?? failure.name );
				return;
			}

			if ( status?.isRegistered ) {
				navigateTo( plan === 'paid' ? UPGRADE_PATH : DASHBOARD_PATH );
				return;
			}

			let authorizeUrl: string | undefined;

			try {
				const registration = await registerSite( {
					redirectUri: DASHBOARD_PATH,
					from: CONNECTION_FROM,
				} );
				authorizeUrl = registration?.authorizeUrl;
			} catch ( e ) {
				const failure = ( e ?? {} ) as RegistrationError;
				fail( failure.response?.code ?? failure.name, failure.response?.message );
				return;
			}

			if ( ! authorizeUrl ) {
				fail( 'missing_authorize_url' );
				return;
			}

			// The one event carrying both keys, so it joins everything above to what the site does once it has an id.
			track( 'register_success', { blog_id: readBlogId( authorizeUrl ) } );

			navigateOnceRecorded( plan === 'paid' ? UPGRADE_PATH : authorizeUrl );
		},
		[ trackEvent, siteSuffix, registerSite, refreshConnectionStatus ]
	);

	return {
		choose,
		pendingPlan,
		error,
		isOfflineMode,
		siteSuffix,
	};
}
