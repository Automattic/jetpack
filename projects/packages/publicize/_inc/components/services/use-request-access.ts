import { useGlobalNotices } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { startServiceConnect } from '../../utils';
import { SupportedService } from './types';

const isValidMastodonUsername = ( username: string ) =>
	/^@?\b([A-Z0-9_]+)@([A-Z0-9.-]+\.[A-Z]{2,})$/gi.test( username );

/**
 * Example valid handles:
 * - domain.tld
 * - username.bsky.social
 * - user-name.bsky.social
 * - my-domain.com
 *
 * @param {string} handle - Handle to validate
 *
 * @return {boolean} - Whether the handle is valid
 */
function isValidBlueskyHandle( handle: string ) {
	const parts = handle.split( '.' ).filter( Boolean );

	// A valid handle should have at least 2 parts - domain, and tld
	if ( parts.length < 2 ) {
		return false;
	}

	return parts.every( part => /^[a-z0-9_-]+$/i.test( part ) );
}

export type RequestAccessOptions = {
	service: SupportedService;
};

/**
 * Per-request options for the function returned by {@link useRequestAccess}.
 */
export type RequestAccessArgs = {
	/**
	 * Append refresh=1 so keyring re-authorizes and refreshes the token in place.
	 */
	refresh?: boolean;
	/**
	 * When set, the connect was initiated from the editor (in a tab opened by it). It is carried
	 * on the return URL so the return handler knows to broadcast + self-close when done.
	 */
	source?: 'editor';
};

/**
 * Hook to start connecting a service via a full-page OAuth redirect (no popup).
 *
 * Navigates the tab to the wpcom connect URL; wpcom redirects back to the Social admin page where
 * the return handler picks up the result. No in-page callback — the tab navigates away.
 *
 * @param {RequestAccessOptions} options - Options
 * @return - Function to start the connection
 */
export function useRequestAccess( { service }: RequestAccessOptions ) {
	const { createErrorNotice } = useGlobalNotices();

	const isMastodonAlreadyConnected = useSelect(
		select => select( store ).isMastodonAccountAlreadyConnected,
		[]
	);

	const isBlueskyAccountAlreadyConnected = useSelect(
		select => select( store ).isBlueskyAccountAlreadyConnected,
		[]
	);

	const { refreshServicesList } = useDispatch( store );

	const { getService, getReconnectingAccount } = useSelect( select => select( store ), [] );

	return useCallback(
		// Resolves to false on an early validation failure; otherwise the tab navigates away.
		async ( formData: FormData, options: RequestAccessArgs = {} ): Promise< boolean > => {
			let connectUrl = service.url;

			if ( ! connectUrl ) {
				// The connect URL is missing; refetch and read it once.
				await refreshServicesList();

				connectUrl = getService( service.id )?.url;

				if ( ! connectUrl ) {
					createErrorNotice(
						__(
							'Could not start the connection. Please refresh the page and try again.',
							'jetpack-publicize-pkg'
						)
					);

					return false;
				}
			}

			// Input-first services post their inputs (credentials never ride a URL); others GET.
			const postFields: Record< string, string > = {};

			switch ( service.id ) {
				case 'mastodon': {
					const instance = formData.get( 'instance' ).toString().trim();

					if ( ! isValidMastodonUsername( instance ) ) {
						createErrorNotice( __( 'Invalid Mastodon username', 'jetpack-publicize-pkg' ) );

						return false;
					}

					// A reconnect (refresh) re-auths an existing account in place, so only block
					// genuine duplicates from a fresh connect.
					if ( ! options.refresh && isMastodonAlreadyConnected?.( instance ) ) {
						createErrorNotice(
							__( 'This Mastodon account is already connected', 'jetpack-publicize-pkg' )
						);

						return false;
					}

					postFields.instance = instance;
					break;
				}

				case 'bluesky': {
					// Let us make the user's life easier by removing the leading "@" if they added it
					const handle = ( formData.get( 'handle' )?.toString() || '' ).trim().replace( /^@/, '' );

					if ( ! isValidBlueskyHandle( handle ) ) {
						createErrorNotice( __( 'Invalid Bluesky handle', 'jetpack-publicize-pkg' ) );

						return false;
					}

					// A reconnect (refresh) re-auths an existing account in place, so only block
					// genuine duplicates from a fresh connect.
					if ( ! options.refresh && isBlueskyAccountAlreadyConnected?.( handle ) ) {
						createErrorNotice(
							__( 'This Bluesky account is already connected', 'jetpack-publicize-pkg' )
						);

						return false;
					}

					postFields.handle = handle;
					postFields.app_password = ( formData.get( 'app_password' )?.toString() || '' ).trim();
					break;
				}

				default:
					break;
			}

			// reconnect_id lets the return handler restore the reconnect context lost on reload.
			const reconnectingAccount = options.refresh ? getReconnectingAccount() : undefined;

			startServiceConnect( connectUrl, service.id, {
				source: options.source,
				refresh: options.refresh,
				reconnectId: reconnectingAccount ? String( reconnectingAccount.connection_id ) : undefined,
				postFields,
			} );

			return true;
		},
		[
			createErrorNotice,
			getReconnectingAccount,
			getService,
			isBlueskyAccountAlreadyConnected,
			isMastodonAlreadyConnected,
			refreshServicesList,
			service,
		]
	);
}
