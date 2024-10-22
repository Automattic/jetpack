import { useGlobalNotices } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { requestExternalAccess } from '../../utils';
import { SupportedService } from './use-supported-services';

const isValidMastodonUsername = ( username: string ) =>
	/^@?\b([A-Z0-9_]+)@([A-Z0-9.-]+\.[A-Z]{2,})$/gi.test( username );

/**
 * Example valid handles:
 * - username.bsky.social
 * - user-name.bsky.social
 * - my_domain.com.bsky.social
 * - my-domain.com.my-own-server.com
 *
 * @param {string} handle - Handle to validate
 *
 * @return {boolean} - Whether the handle is valid
 */
function isValidBlueskyHandle( handle: string ) {
	const parts = handle.split( '.' ).filter( Boolean );

	// A valid handle should have at least 3 parts - username, domain, and tld
	if ( parts.length < 3 ) {
		return false;
	}

	return parts.every( part => /^[a-z0-9_-]+$/i.test( part ) );
}

export type RequestAccessOptions = {
	service: SupportedService;
	onConfirm: ( data: unknown ) => void;
};

/**
 * Hook to request access to a service.
 *
 * @param {RequestAccessOptions} options - Options
 * @return {(formData: FormData) => void} - Function to request access
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

	return useCallback(
		( formData: FormData ) => {
			const url = new URL( service.connect_URL );

			switch ( service.ID ) {
				case 'mastodon': {
					const instance = formData.get( 'instance' ).toString().trim();

					if ( ! isValidMastodonUsername( instance ) ) {
						createErrorNotice( __( 'Invalid Mastodon username', 'jetpack' ) );

						return;
					}

					if ( isMastodonAlreadyConnected?.( instance ) ) {
						createErrorNotice( __( 'This Mastodon account is already connected', 'jetpack' ) );

						return;
					}

					url.searchParams.set( 'instance', instance );
					break;
				}

				case 'bluesky': {
					// Let us make the user's life easier by removing the leading "@" if they added it
					const handle = ( formData.get( 'handle' )?.toString() || '' ).trim().replace( /^@/, '' );

					if ( ! isValidBlueskyHandle( handle ) ) {
						createErrorNotice( __( 'Invalid Bluesky handle', 'jetpack' ) );

						return;
					}

					if ( isBlueskyAccountAlreadyConnected?.( handle ) ) {
						createErrorNotice( __( 'This Bluesky account is already connected', 'jetpack' ) );

						return;
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

			requestExternalAccess( url.toString(), onConfirm );
		},
		[
			createErrorNotice,
			isBlueskyAccountAlreadyConnected,
			isMastodonAlreadyConnected,
			onConfirm,
			service.ID,
			service.connect_URL,
		]
	);
}
