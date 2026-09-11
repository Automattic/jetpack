import { useGlobalNotices } from '@automattic/jetpack-components';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { requestExternalAccess } from '../../utils';
import { SupportedService } from './types';
import { useConnectInputValidation } from './use-connect-input-validation';

export type RequestAccessOptions = {
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
	 * Called with the request ID when this auth_flow=v2 attempt looks abandoned (the user returned without a result, or the TTL elapsed).
	 */
	onAbort?: ( requestId: string ) => void;
	/**
	 * Called with the failure message instead of the global error notice. The
	 * connection flow passes this so the error renders inside its modal, where a
	 * global notice would sit behind the dialog.
	 */
	onError?: ( message: string ) => void;
};

/**
 * Hook to request access to a service.
 *
 * The service is passed per call, so callers that only learn it from the
 * interaction can still open the popup from the event handler.
 *
 * @param {RequestAccessOptions} options - Options
 * @return - Function to request access
 */
export function useRequestAccess( { onConfirm }: RequestAccessOptions ) {
	const { createErrorNotice } = useGlobalNotices();

	const validateInputs = useConnectInputValidation();

	const { refreshServicesList } = useDispatch( store );

	const { getService } = useSelect( select => select( store ), [] );

	return useCallback(
		/* Resolves to the request ID once the connect popup is open, or null on any
		   early failure. Callers correlate late callbacks against that ID. */
		async (
			service: SupportedService,
			formData: FormData,
			options: RequestAccessArgs = {}
		): Promise< string | null > => {
			const reportError = options.onError ?? createErrorNotice;

			let connectUrl = service.url;

			if ( ! connectUrl ) {
				// The connect URL is missing; refetch and read it once.
				await refreshServicesList();

				connectUrl = getService( service.id )?.url;

				if ( ! connectUrl ) {
					reportError(
						__(
							'Could not start the connection. Please refresh the page and try again.',
							'jetpack-publicize-pkg'
						)
					);

					return null;
				}
			}

			const url = new URL( connectUrl );

			/*
			 * A reconnect (refresh) re-auths an existing account in place, so only block
			 * genuine duplicates from a fresh connect.
			 */
			const { values, error } = validateInputs(
				service.id,
				Object.fromEntries(
					Array.from( formData.entries(), ( [ key, value ] ) => [ key, value.toString() ] )
				),
				{ allowDuplicate: options.refresh }
			);

			if ( error ) {
				reportError( error.message );

				return null;
			}

			for ( const [ key, value ] of Object.entries( values ) ) {
				url.searchParams.set( key, value );
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
				() => options.onAbort?.( requestId )
			);

			if ( ! opened ) {
				reportError(
					__(
						'The connection window could not be opened. Please allow pop-ups for this site and try again.',
						'jetpack-publicize-pkg'
					)
				);

				return null;
			}

			return requestId;
		},
		[ createErrorNotice, getService, onConfirm, refreshServicesList, validateInputs ]
	);
}
