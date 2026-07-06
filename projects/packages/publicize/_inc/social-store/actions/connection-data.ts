import { globalNoticesStore } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { dispatch as coreDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { CUSTOMIZE_PER_NETWORK_KEY } from '../constants';
import { Connection, EditorConnection, KeyringResponse, KeyringResult } from '../types';
import {
	ADD_CONNECTION,
	DELETE_CONNECTION,
	DELETING_CONNECTION,
	FETCHING_KEYRING_RESULT,
	SET_RECONNECTING_ACCOUNT,
	SET_CONNECTIONS,
	SET_KEYRING_RESULT,
	TOGGLE_CONNECTION,
	TOGGLE_CONNECTIONS_MODAL,
	UPDATE_CONNECTION,
	UPDATING_CONNECTION,
	REQUEST_TYPE_REFRESH_CONNECTIONS,
	ADD_ABORT_CONTROLLER,
	REMOVE_ABORT_CONTROLLERS,
	CUSTOMIZE_CONNECTION,
} from './constants';

type UpdateConnectionOptions = {
	/**
	 * Skip transient UI side effects for background saves. This suppresses the
	 * row-level updating state and generic success notice; errors are still shown.
	 */
	silent?: boolean;
};

/**
 * Set connections list
 * @param connections - list of connections
 * @return An action object.
 */
export function setConnections( connections: Array< Connection > ) {
	return {
		type: SET_CONNECTIONS,
		connections,
	};
}

/**
 * Set keyring result
 *
 * @param keyringResult - keyring result
 *
 * @return An action object.
 */
export function setKeyringResult( keyringResult?: KeyringResult ) {
	return {
		type: SET_KEYRING_RESULT,
		keyringResult,
	};
}

/**
 * Set whether the keyring result is being fetched.
 *
 * @param fetching - Whether the request is in progress.
 *
 * @return An action object.
 */
export function setFetchingKeyringResult( fetching: boolean ) {
	return {
		type: FETCHING_KEYRING_RESULT,
		fetching,
	};
}

/**
 * Fetch the keyring result for a completed connect request (auth_flow=v2).
 *
 * In the v2 flow the connect popup returns no data through window.opener; instead the
 * same-origin completion page broadcasts the request_id and we fetch the verified keyring
 * connection item once from the server. The shape matches what the popup used to post, so
 * the confirmation UI is unchanged.
 *
 * @param requestId - The connect request ID.
 *
 * @return A thunk resolving to the keyring result, if any.
 */
export function fetchKeyringResult( requestId: string ) {
	return async function ( { dispatch } ) {
		dispatch( setFetchingKeyringResult( true ) );

		try {
			const response = await apiFetch< KeyringResponse >( {
				path: addQueryArgs( '/wpcom/v2/publicize/keyring-result', { request_id: requestId } ),
			} );

			if ( response?.code === 'success' && response.data ) {
				return response.data;
			}
		} catch {
			// Swallow the error: an absent result is surfaced to the user as "no accounts found".
		} finally {
			dispatch( setFetchingKeyringResult( false ) );
		}
	};
}

/**
 * Add connection to the list
 * @param connection - connection object
 * @return An action object.
 */
export function addConnection( connection: Partial< Connection > ) {
	return {
		type: ADD_CONNECTION,
		connection,
	};
}

/**
 * Toggle connection enable status.
 * @param connectionId - Connection ID to switch.
 *
 * @return Switch connection enable-status action.
 */
export function toggleConnection( connectionId: string ) {
	return {
		type: TOGGLE_CONNECTION,
		connectionId,
	};
}

/**
 * Merge connections with fresh connections.
 * @param freshConnections - list of fresh connections
 * @return A thunk to merge connections.
 */
export function mergeConnections( freshConnections: Array< Connection > ) {
	return function ( { dispatch, select } ) {
		// Combine current connections with new connections.
		const prevConnections: Array< Connection > = select.getConnections();
		const connections = [];
		const defaults = {
			enabled: true,
		};

		/*
		 * Iterate connection by connection,
		 * in order to refresh or update current connections.
		 */
		for ( const freshConnection of freshConnections ) {
			const prevConnection = prevConnections.find(
				conn => conn.connection_id === freshConnection.connection_id
			);

			const connection = {
				...defaults,
				...prevConnection,
				...freshConnection,
			};
			connections.push( connection );
		}
		dispatch( setConnections( connections ) );
	};
}

/**
 * Create an abort controller.
 * @param abortController - Abort controller.
 * @param requestType     - Type of abort request.
 *
 * @return An action object.
 */
export function createAbortController( abortController: AbortController, requestType: string ) {
	return {
		type: ADD_ABORT_CONTROLLER,
		requestType,
		abortController,
	};
}

/**
 * Remove abort controllers.
 *
 * @param requestType - Type of abort request.
 *
 * @return An action object.
 */
export function removeAbortControllers( requestType: string ) {
	return {
		type: REMOVE_ABORT_CONTROLLERS,
		requestType,
	};
}

/**
 * Abort a request.
 *
 * @param requestType - Type of abort request.
 *
 * @return A thunk to abort a request.
 */
export function abortRequest( requestType: string ) {
	return function ( { dispatch, select } ) {
		const abortControllers = select.getAbortControllers( requestType );

		for ( const controller of abortControllers ) {
			controller.abort();
		}

		// Remove the abort controllers.
		dispatch( removeAbortControllers( requestType ) );
	};
}

/**
 * Abort the refresh connections request.
 *
 * @return A thunk to abort a request.
 */
export function abortRefreshConnectionsRequest() {
	return abortRequest( REQUEST_TYPE_REFRESH_CONNECTIONS );
}

/**
 * Fetch connections from the server and merge them into the store.
 *
 * @param queryParams - Query params for the connections endpoint, e.g. `{ test_connections: 1 }` to run connection tests.
 * @param syncToMeta  - Whether to sync the connection state to the post meta.
 * @return A thunk to fetch connections.
 */
export function fetchConnections(
	queryParams: Record< string, string | number > = {},
	syncToMeta = false
) {
	return async function ( { dispatch, select } ) {
		try {
			const path = addQueryArgs( '/wpcom/v2/publicize/connections', queryParams );

			// Wait until all connections are done updating/deleting.
			while (
				select.getUpdatingConnections().length > 0 ||
				select.getDeletingConnections().length > 0
			) {
				await new Promise( resolve => setTimeout( resolve, 100 ) );
			}

			const abortController = new AbortController();

			dispatch( createAbortController( abortController, REQUEST_TYPE_REFRESH_CONNECTIONS ) );

			// Pass the abort controller signal to the fetch request.
			const freshConnections = await apiFetch< Array< Connection > >( {
				path,
				signal: abortController.signal,
			} );

			dispatch( mergeConnections( freshConnections ) );

			if ( syncToMeta ) {
				dispatch( syncConnectionsToPostMeta() );
			}
		} catch ( e ) {
			// If the request was aborted.
			if ( 'AbortError' === e.name ) {
				// Fire it again to run after the current operation that cancelled the request.
				dispatch( fetchConnections( queryParams, syncToMeta ) );
			}
		}
	};
}

/**
 * Refresh the connection test results.
 *
 * @param syncToMeta - Whether to sync the connection state to the post meta.
 * @return A thunk to refresh connection test results.
 */
export function refreshConnectionTestResults( syncToMeta = false ) {
	return fetchConnections( { test_connections: 1 }, syncToMeta );
}

/**
 * Syncs the connections to the post meta.
 *
 * @return A thunk to sync connections to post meta.
 */
export function syncConnectionsToPostMeta() {
	return function ( { registry, select } ) {
		const connections = select.getConnections();

		// Update post metadata.
		return registry.dispatch( editorStore ).editPost( {
			jetpack_publicize_connections: connections,
		} );
	};
}

/**
 * Toggles the connection enable-status.
 *
 * @param connectionId - Connection ID to switch.
 * @return A thunk to switch connection enable-status.
 */
export function toggleConnectionById( connectionId: string ) {
	return function ( { registry, dispatch } ) {
		dispatch( toggleConnection( connectionId ) );

		const customizingPerNetwork = Boolean(
			registry.select( editorStore ).getEditedPostAttribute( 'meta' )?.[ CUSTOMIZE_PER_NETWORK_KEY ]
		);

		const isPostPublished = registry.select( editorStore ).isCurrentPostPublished();

		/**
		 * For published posts, we do not save the connection enable-status to post meta,
		 * but when customizing per network, we need to ensure
		 * that the connection toggle results in sync
		 * because the connection overrides are saved for published posts as well.
		 */
		const shouldSyncToMeta = customizingPerNetwork || ! isPostPublished;

		if ( shouldSyncToMeta ) {
			dispatch( syncConnectionsToPostMeta() );
		}
	};
}

/**
 * Deletes a connection.
 *
 * @param connectionId - Connection ID to delete.
 *
 * @return An action object.
 */
export function deleteConnection( connectionId: string ) {
	return {
		type: DELETE_CONNECTION,
		connectionId,
	};
}

/**
 * Marks a connection as being deleted.
 *
 * @param connectionId - Connection ID to delete.
 * @param deleting     - Whether the connection is being deleted.
 *
 * @return An action object.
 */
export function deletingConnection( connectionId: string, deleting = true ) {
	return {
		type: DELETING_CONNECTION,
		connectionId,
		deleting,
	};
}

/**
 * Deletes a connection by disconnecting it.
 *
 * @param args                   - Arguments.
 * @param args.connectionId      - Connection ID to delete.
 * @param args.showSuccessNotice - Whether to show a success notice.
 *
 * @return A thunk that resolves to true if the connection was deleted, false otherwise.
 */
export function deleteConnectionById( {
	connectionId,
	showSuccessNotice = true,
}: {
	connectionId: string;
	showSuccessNotice?: boolean;
} ) {
	return async function ( { registry, dispatch } ) {
		const { createErrorNotice, createSuccessNotice } = coreDispatch( globalNoticesStore );

		try {
			const path = `/wpcom/v2/publicize/connections/${ connectionId }`;

			// Abort the refresh connections request.
			dispatch( abortRefreshConnectionsRequest() );

			dispatch( deletingConnection( connectionId ) );

			await apiFetch( { method: 'DELETE', path } );

			dispatch( deleteConnection( connectionId ) );

			if ( showSuccessNotice ) {
				createSuccessNotice( __( 'Account disconnected successfully.', 'jetpack-publicize-pkg' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			}

			// If we are on post editor, sync the connections to the post meta.
			if ( registry.select( editorStore ).getCurrentPostId() ) {
				dispatch( syncConnectionsToPostMeta() );
			}

			return true;
		} catch ( error ) {
			let message: string = __( 'Error disconnecting account.', 'jetpack-publicize-pkg' );

			if ( typeof error === 'object' && 'message' in error && error.message ) {
				message = `${ message } ${ error.message }`;
			}

			createErrorNotice( message, { type: 'snackbar', isDismissible: true } );
		} finally {
			dispatch( deletingConnection( connectionId, false ) );
		}

		return false;
	};
}

let uniqueId = 1;

/**
 * Creates a connection.
 *
 * @param data           - The data for API call.
 * @param optimisticData - Optimistic data for the connection.
 *
 * @return A thunk to create a connection.
 */
export function createConnection(
	data: Record< string, unknown >,
	optimisticData: Partial< Connection > = {}
) {
	return async function ( { registry, dispatch } ) {
		const { createErrorNotice, createSuccessNotice } = coreDispatch( globalNoticesStore );

		const tempId = `new-${ ++uniqueId }`;

		try {
			const path = `/wpcom/v2/publicize/connections/`;

			dispatch(
				addConnection( {
					connection_id: tempId,
					...optimisticData,
				} )
			);
			// Abort the refresh connections request.
			dispatch( abortRefreshConnectionsRequest() );

			// Mark the connection as updating to show the spinner.
			dispatch( updatingConnection( tempId ) );

			const connection = await apiFetch< Connection >( { method: 'POST', path, data } );

			if ( connection ) {
				dispatch(
					// Updating the connection will also override the connection_id.
					updateConnection( tempId, {
						...connection,
						// For editor, we always enable the connection by default.
						enabled: true,
					} )
				);

				createSuccessNotice(
					sprintf(
						/* translators: %s is the name of the social media platform e.g. "Facebook" */
						__( '%s account connected successfully.', 'jetpack-publicize-pkg' ),
						connection.service_label
					),
					{
						type: 'snackbar',
						isDismissible: true,
					}
				);

				// If we are on post editor, sync the connections to the post meta.
				if ( registry.select( editorStore ).getCurrentPostId() ) {
					dispatch( syncConnectionsToPostMeta() );
				}
			}
		} catch ( error ) {
			let message: string = __( 'Error connecting account.', 'jetpack-publicize-pkg' );

			if ( typeof error === 'object' && 'message' in error && error.message ) {
				message = `${ message } ${ error.message }`;
			}

			createErrorNotice( message, { type: 'snackbar', isDismissible: true } );
		} finally {
			dispatch( updatingConnection( tempId, false ) );
			// If the connection was not created, delete it.
			dispatch( deleteConnection( tempId ) );
		}
	};
}

/**
 * Updates a connection.
 *
 * @param connectionId - Connection ID to update.
 * @param data         - The data.
 *
 * @return An action object.
 */
export function updateConnection( connectionId: string, data: Partial< Connection > ) {
	return {
		type: UPDATE_CONNECTION,
		connectionId,
		data,
	};
}

/**
 * Marks a connection as being updating.
 *
 * @param connectionId - Connection ID being updated.
 * @param updating     - Whether the connection is being updated.
 *
 * @return An action object.
 */
export function updatingConnection( connectionId: string, updating = true ) {
	return {
		type: UPDATING_CONNECTION,
		connectionId,
		updating,
	};
}

/**
 * Sets the reconnecting account.
 *
 * @param reconnectingAccount - Account being reconnected.
 *
 * @return An action object.
 */
export function setReconnectingAccount( reconnectingAccount: Connection ) {
	return {
		type: SET_RECONNECTING_ACCOUNT,
		reconnectingAccount,
	};
}

/**
 * Completes an in-place reconnect when the connect result matches the account being reconnected.
 *
 * @param keyringResult - The keyring result from the completed connect request.
 *
 * @return A thunk resolving to true if it handled an in-place reconnect, false otherwise.
 */
export function completeReconnect( keyringResult?: KeyringResult ) {
	return async function ( { dispatch, select } ) {
		const reconnectingAccount = select.getReconnectingAccount();

		if ( ! reconnectingAccount || ! keyringResult?.ID ) {
			return false;
		}

		const reconnectedIds = [
			keyringResult.external_ID,
			...( keyringResult.additional_external_users?.map( user => user.external_ID ) ?? [] ),
		]
			.filter( Boolean )
			.map( String );

		if ( ! reconnectedIds.includes( reconnectingAccount.external_id ) ) {
			return false;
		}

		await dispatch( refreshConnectionTestResults() );

		// The account matched, but confirm the refreshed connection actually recovered before
		// reporting success — re-authing doesn't guarantee the token now passes the test.
		const recovered =
			select.getConnectionById( reconnectingAccount.connection_id )?.status === 'ok';

		// Clear the reconnecting account only after the refresh, so the busy state stays until
		// the connection list reflects the reconnection.
		dispatch( setReconnectingAccount( undefined ) );

		const { createSuccessNotice, createErrorNotice } = coreDispatch( globalNoticesStore );

		if ( recovered ) {
			createSuccessNotice( __( 'Account reconnected successfully.', 'jetpack-publicize-pkg' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} else {
			createErrorNotice(
				__( 'The account could not be reconnected. Please try again.', 'jetpack-publicize-pkg' ),
				{ type: 'snackbar', isDismissible: true }
			);
		}

		return true;
	};
}

/**
 * Updates a connection.
 *
 * @param connectionId   - Connection ID to update.
 * @param data           - The data for API call.
 * @param options        - Options for update UI side-effects.
 * @param options.silent - Whether to skip row-level updating state and the generic success notice.
 * @return A thunk to update a connection.
 */
export function updateConnectionById(
	connectionId: string,
	data: Partial< Connection >,
	options: UpdateConnectionOptions = {}
) {
	return async function ( { dispatch, select } ) {
		const { createErrorNotice, createSuccessNotice } = coreDispatch( globalNoticesStore );
		const { silent = false } = options;

		const prevConnection = select.getConnectionById( connectionId );

		try {
			const path = `/wpcom/v2/publicize/connections/${ connectionId }`;

			// Abort the refresh connections request.
			dispatch( abortRefreshConnectionsRequest() );

			// Optimistically update the connection.
			dispatch( updateConnection( connectionId, data ) );

			if ( ! silent ) {
				dispatch( updatingConnection( connectionId ) );
			}

			const connection = await apiFetch( { method: 'POST', path, data } );

			if ( connection && ! silent ) {
				createSuccessNotice( __( 'Account updated successfully.', 'jetpack-publicize-pkg' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			}
		} catch ( error ) {
			let message: string = __( 'Error updating account.', 'jetpack-publicize-pkg' );

			if ( typeof error === 'object' && 'message' in error && error.message ) {
				message = `${ message } ${ error.message }`;
			}

			// Revert the connection to its previous state.
			dispatch( updateConnection( connectionId, prevConnection ) );

			createErrorNotice( message, { type: 'snackbar', isDismissible: true } );
		} finally {
			if ( ! silent ) {
				dispatch( updatingConnection( connectionId, false ) );
			}
		}
	};
}

/**
 * Toggles the connections modal.
 *
 * @param isOpen - Whether the modal is open.
 *
 * @return An action object.
 */
export function toggleConnectionsModal( isOpen: boolean ) {
	return {
		type: TOGGLE_CONNECTIONS_MODAL,
		isOpen,
	};
}

/**
 * Opens the connections modal.
 *
 * @return An action object.
 */
export function openConnectionsModal() {
	return toggleConnectionsModal( true );
}

/**
 * Closes the connections modal.
 * @return An action object.
 */
export function closeConnectionsModal() {
	return toggleConnectionsModal( false );
}

/**
 * Customizes the connection.
 *
 * @param connectionId - Connection ID.
 * @param data         - The customization data.
 * @return An action object.
 */
export function customizeConnection(
	connectionId: string,
	data: Omit< EditorConnection, 'enabled' >
) {
	return {
		type: CUSTOMIZE_CONNECTION,
		connectionId,
		data,
	};
}
/**
 * Customizes the connection.
 *
 * @param connectionId - Connection ID.
 * @param data         - The customization data.
 * @param syncToMeta   - Whether to sync the connection state to the post meta.
 * @return A thunk.
 */
export function customizeConnectionById(
	connectionId: string,
	data: Omit< EditorConnection, 'enabled' >,
	syncToMeta = true
) {
	return async function ( { dispatch } ) {
		await dispatch( customizeConnection( connectionId, data ) );

		if ( syncToMeta ) {
			await dispatch( syncConnectionsToPostMeta() );
		}
	};
}
