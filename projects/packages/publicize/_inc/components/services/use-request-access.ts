import { useGlobalNotices } from '@automattic/jetpack-components';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { requestExternalAccess } from '../../utils';
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
	onConfirm: ( requestId: string ) => void | Promise< void >;
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
	 * Called when this auth_flow=v2 attempt looks abandoned (the user returned without a result, or the TTL elapsed).
	 */
	onAbort?: VoidFunction;
};

/**
 * Hook to request access to a service.
 *
 * @param {RequestAccessOptions} options - Options
 * @return - Function to request access
 */
export function useRequestAccess( { service, onConfirm }: RequestAccessOptions ) {
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

	const { getService } = useSelect( select => select( store ), [] );

	return useCallback(
		// Resolves to true when the connect popup opened, false on any early failure.
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

			const url = new URL( connectUrl );

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

					url.searchParams.set( 'instance', instance );
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

					url.searchParams.set( 'handle', handle );
					url.searchParams.set(
						'app_password',
						( formData.get( 'app_password' )?.toString() || '' ).trim()
					);
					break;
				}

				default:
					break;
			}

			/*
			 * auth_flow=v2 returns the connection result via a same-origin BroadcastChannel
			 * instead of window.opener.postMessage (which Meta/Threads sever via COOP).
			 * The unique request_id correlates the connect request with the stored result, and
			 * return_url is where public-api redirects the popup back to so it can broadcast.
			 */
			const requestId = Math.random().toString( 36 ).slice( 2, 12 );

			url.searchParams.set( 'auth_flow', 'v2' );
			url.searchParams.set( 'request_id', requestId );
			url.searchParams.set(
				'return_url',
				getAdminUrl( 'admin-post.php?action=jetpack_social_keyring_done' )
			);

			/*
			 * refresh=1 tells keyring to re-authorize the account and refresh the token in
			 * place (used for reconnect) rather than reuse an existing provider session.
			 */
			if ( options.refresh ) {
				url.searchParams.set( 'refresh', '1' );
			}

			const opened = requestExternalAccess(
				url.toString(),
				() => onConfirm( requestId ),
				options.onAbort
			);

			if ( ! opened ) {
				createErrorNotice(
					__(
						'The connection window could not be opened. Please allow pop-ups for this site and try again.',
						'jetpack-publicize-pkg'
					)
				);
			}

			return opened;
		},
		[
			createErrorNotice,
			getService,
			isBlueskyAccountAlreadyConnected,
			isMastodonAlreadyConnected,
			onConfirm,
			refreshServicesList,
			service,
		]
	);
}
