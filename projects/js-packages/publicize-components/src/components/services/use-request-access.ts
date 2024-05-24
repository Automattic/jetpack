import { useGlobalNotices } from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { requestExternalAccess } from '../../utils';
import { SupportedService } from './use-supported-services';

const isValidMastodonUsername = ( username: string ) =>
	/^@?\b([A-Z0-9_]+)@([A-Z0-9.-]+\.[A-Z]{2,})$/gi.test( username );

export type RequestAccessOptions = {
	service: SupportedService;
	onConfirm: ( data: unknown ) => void;
};

/**
 * Hook to request access to a service.
 *
 * @param {RequestAccessOptions} options - Options
 * @returns {(formData: FormData) => void} - Function to request access
 */
export function useRequestAccess( { service, onConfirm }: RequestAccessOptions ) {
	const { createErrorNotice } = useGlobalNotices();

	const isMastodonAlreadyConnected = useSelect(
		select => select( store ).isMastodonAccountAlreadyConnected,
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

					url.searchParams.set( 'instance', formData.get( 'instance' ) as string );
					break;
				}

				default:
					break;
			}

			requestExternalAccess( url.toString(), onConfirm );
		},
		[ createErrorNotice, isMastodonAlreadyConnected, onConfirm, service.ID, service.connect_URL ]
	);
}
