import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { useRequestAccess } from '../services/use-request-access';
import { useService } from '../services/use-service';
import type { ConnectionService } from '../../types';
import type { ConnectInputValues } from '../services/connect-input-validation';

/**
 * Opens a service's connect popup and wires its outcome back into the flow.
 *
 * Called from the event handler that asked for the connection, never from a
 * mount effect: browsers only allow `window.open` while the user's gesture is
 * still in scope. The caller advances to `authorizing` once it resolves true.
 *
 * Never throws: a failure is reported on the current step and resolves false.
 *
 * @return A function opening the popup, resolving to whether it opened.
 */
export function useStartAuthorization() {
	const { getConnectionFlowRequestId, getReconnectingAccount } = useSelect(
		select => select( store ),
		[]
	);

	const {
		fetchKeyringResult,
		setKeyringResult,
		completeReconnect,
		abandonAuthorization,
		failAuthorization,
		setConnectionFlowError,
		setConnectionFlowRequestId,
	} = useDispatch( store );

	const getService = useService();

	const onConfirm = useCallback(
		async ( requestId: string ) => {
			/* A popup outlives the attempt that opened it: its listener only goes on
			   a result or the 5 minute TTL, and it fires again after an abort. Only
			   the request the flow is waiting on may move it. */
			const isCurrent = () => requestId === getConnectionFlowRequestId();

			if ( ! isCurrent() ) {
				return;
			}

			const result = await fetchKeyringResult( requestId );

			// An in-place reconnect is complete on its own; nothing more to show.
			if ( await completeReconnect( result ) ) {
				return;
			}

			// The flow can have moved on while the result was being fetched.
			if ( ! isCurrent() ) {
				return;
			}

			if ( ! result?.ID ) {
				// The popup completed, so no abort signal is coming to unstick the step.
				failAuthorization(
					__( 'The connection could not be completed. Please try again.', 'jetpack-publicize-pkg' )
				);

				return;
			}

			// Surfacing the result moves the flow on to its confirmation step.
			setKeyringResult( result );
		},
		[
			completeReconnect,
			failAuthorization,
			fetchKeyringResult,
			getConnectionFlowRequestId,
			setKeyringResult,
		]
	);

	const requestAccess = useRequestAccess( { onConfirm } );

	return useCallback(
		/**
		 * Starts the authorization flow by opening the connect popup for the given service.
		 *
		 * @param serviceId  - The service to connect.
		 * @param formInputs - Connect inputs, for the services that need them.
		 *
		 * @return Whether the popup opened.
		 */
		async function startAuthorization(
			serviceId: ConnectionService[ 'id' ],
			formInputs: ConnectInputValues = {}
		): Promise< boolean > {
			// Anything still pending from a previous attempt is now stale.
			setConnectionFlowRequestId( undefined );

			const unavailable = __(
				'Could not start the connection. Please refresh the page and try again.',
				'jetpack-publicize-pkg'
			);

			const service = getService( serviceId );

			if ( ! service ) {
				setConnectionFlowError( unavailable );

				return false;
			}

			const formData = new FormData();

			for ( const [ key, value ] of Object.entries( formInputs ) ) {
				formData.set( key, value );
			}

			try {
				const requestId = await requestAccess( service, formData, {
					refresh: getReconnectingAccount()?.service_name === serviceId,
					// Fires from `authorizing`, so it steps back.
					onAbort: abandoned => {
						if ( abandoned === getConnectionFlowRequestId() ) {
							abandonAuthorization();
						}
					},
					// The popup never opened; the user is still on the step that asked.
					onError: setConnectionFlowError,
				} );

				if ( requestId ) {
					setConnectionFlowRequestId( requestId );
				}

				return Boolean( requestId );
			} catch {
				setConnectionFlowError( unavailable );

				return false;
			}
		},
		[
			abandonAuthorization,
			getConnectionFlowRequestId,
			getReconnectingAccount,
			getService,
			requestAccess,
			setConnectionFlowError,
			setConnectionFlowRequestId,
		]
	);
}
