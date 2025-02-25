import { useGlobalNotices } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { requestExternalAccess } from '../../utils';
import { SupportedService } from './use-supported-services';

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
	onConfirm: ( data: unknown ) => void;
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
		async ( formData: FormData ) => {
			let connectUrl = service.url;

			if ( ! connectUrl ) {
				await refreshServicesList();
				// Wait until the services list is refreshed
				do {
					await new Promise( resolve => setTimeout( resolve, 100 ) );

					connectUrl = getService( service.id )?.url;
				} while ( ! connectUrl );
			}

			const url = new URL( connectUrl );

			switch ( service.id ) {
				case 'mastodon': {
					const instance = formData.get( 'instance' ).toString().trim();

					if ( ! isValidMastodonUsername( instance ) ) {
						createErrorNotice( __( 'Invalid Mastodon username', 'jetpack-publicize-components' ) );

						return;
					}

					if ( isMastodonAlreadyConnected?.( instance ) ) {
						createErrorNotice(
							__( 'This Mastodon account is already connected', 'jetpack-publicize-components' )
						);

						return;
					}

					url.searchParams.set( 'instance', instance );
					break;
				}

				case 'bluesky': {
					// Let us make the user's life easier by removing the leading "@" if they added it
					const handle = ( formData.get( 'handle' )?.toString() || '' ).trim().replace( /^@/, '' );

					if ( ! isValidBlueskyHandle( handle ) ) {
						createErrorNotice( __( 'Invalid Bluesky handle', 'jetpack-publicize-components' ) );

						return;
					}

					if ( isBlueskyAccountAlreadyConnected?.( handle ) ) {
						createErrorNotice(
							__( 'This Bluesky account is already connected', 'jetpack-publicize-components' )
						);

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
			getService,
			isBlueskyAccountAlreadyConnected,
			isMastodonAlreadyConnected,
			onConfirm,
			refreshServicesList,
			service,
		]
	);
}
