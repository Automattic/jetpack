import { globalNoticesStore } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { dispatch as coreDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	ADD_CONNECTION,
	DELETE_CONNECTION,
	DELETING_CONNECTION,
	SET_CONNECTIONS,
	SET_KEYRING_RESULT,
	TOGGLE_CONNECTION,
	TOGGLE_CONNECTIONS_MODAL,
	UPDATE_CONNECTION,
	UPDATING_CONNECTION,
} from './constants';

/**
 * Set connections list
 * @param {Array<import('../types').Connection>} connections - list of connections
 * @returns {object} - an action object.
 */
export function setConnections( connections ) {
	return {
		type: SET_CONNECTIONS,
		connections,
	};
}

/**
 * Set keyring result
 *
 * @param {import('../types').KeyringResult} [keyringResult] - keyring result
 *
 * @returns {object} - an action object.
 */
export function setKeyringResult( keyringResult ) {
	return {
		type: SET_KEYRING_RESULT,
		keyringResult,
	};
}

/**
 * Add connection to the list
 * @param {import('../types').Connection} connection - connection object
 * @returns {object} - an action object.
 */
export function addConnection( connection ) {
	return {
		type: ADD_CONNECTION,
		connection,
	};
}

/**
 * Toggle connection enable status.
 * @param {string} connectionId - Connection ID to switch.
 *
 * @returns {object} Switch connection enable-status action.
 */
export function toggleConnection( connectionId ) {
	return {
		type: TOGGLE_CONNECTION,
		connectionId,
	};
}

/**
 * Merge connections with fresh connections.
 * @param {Array} freshConnections - list of fresh connections
 * @returns {Function} - a function to merge connections.
 */
export function mergeConnections( freshConnections ) {
	return function ( { dispatch, select } ) {
		// Combine current connections with new connections.
		const prevConnections = select.getConnections();
		const connections = [];
		const defaults = {
			done: false,
			enabled: Boolean( select.numberOfSharesRemaining() ),
			toggleable: true,
		};

		/*
		 * Iterate connection by connection,
		 * in order to refresh or update current connections.
		 */
		for ( const freshConnection of freshConnections ) {
			const prevConnection = prevConnections.find( conn =>
				conn.connection_id
					? conn.connection_id === freshConnection.connection_id
					: conn.id === freshConnection.id
			);

			const connection = {
				...defaults,
				...prevConnection,
				...freshConnection,
				shared: prevConnection?.shared,
				is_healthy: freshConnection.test_success,
			};
			connections.push( connection );
		}
		dispatch( setConnections( connections ) );
	};
}

/**
 * Effect handler which will refresh the connection test results.
 *
 * @param {boolean} syncToMeta  - Whether to sync the connection state to the post meta.
 * @returns {Function} Refresh connection test results action.
 */
export function refreshConnectionTestResults( syncToMeta = false ) {
	return async function ( { dispatch, select } ) {
		try {
			const path = select.connectionRefreshPath() || '/wpcom/v2/publicize/connection-test-results';

			const freshConnections = await apiFetch( { path } );

			dispatch( mergeConnections( freshConnections ) );

			if ( syncToMeta ) {
				dispatch( syncConnectionsToPostMeta() );
			}
		} catch ( e ) {
			// Do nothing.
		}
	};
}

/**
 * Syncs the connections to the post meta.
 *
 * @returns {Function} Sync connections to post meta action.
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
 * @param {string} connectionId - Connection ID to switch.
 * @param {boolean} syncToMeta  - Whether to sync the connection state to the post meta.
 * @returns {object} Switch connection enable-status action.
 */
export function toggleConnectionById( connectionId, syncToMeta = true ) {
	return function ( { dispatch } ) {
		dispatch( toggleConnection( connectionId ) );

		if ( syncToMeta ) {
			dispatch( syncConnectionsToPostMeta() );
		}
	};
}

/**
 * Deletes a connection.
 *
 * @param {string} connectionId - Connection ID to delete.
 *
 * @returns {object} Delete connection action.
 */
export function deleteConnection( connectionId ) {
	return {
		type: DELETE_CONNECTION,
		connectionId,
	};
}

/**
 * Marks a connection as being deleted.
 *
 * @param {string} connectionId - Connection ID to delete.
 * @param {boolean} deleting - Whether the connection is being deleted.
 *
 * @returns {object} Deleting connection action.
 */
export function deletingConnection( connectionId, deleting = true ) {
	return {
		type: DELETING_CONNECTION,
		connectionId,
		deleting,
	};
}

/**
 * Deletes a connection by disconnecting it.
 *
 * @param {object} args - Arguments.
 * @param {string | number} args.connectionId - Connection ID to delete.
 * @param {boolean} [args.showSuccessNotice] - Whether to show a success notice.
 *
 * @returns {boolean} Whether the connection was deleted.
 */
export function deleteConnectionById( { connectionId, showSuccessNotice = true } ) {
	return async function ( { registry, dispatch } ) {
		const { createErrorNotice, createSuccessNotice } = coreDispatch( globalNoticesStore );

		try {
			const path = `/jetpack/v4/social/connections/${ connectionId }`;

			dispatch( deletingConnection( connectionId ) );

			await apiFetch( { method: 'DELETE', path } );

			dispatch( deleteConnection( connectionId ) );

			if ( showSuccessNotice ) {
				createSuccessNotice( __( 'Account disconnected successfully.', 'jetpack' ), {
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
			let message = __( 'Error disconnecting account.', 'jetpack' );

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
 * @param {Record<string, any>} data - The data for API call.
 * @param {Record<string, any>} optimisticData - Optimistic data for the connection.
 * @returns {void}
 */
export function createConnection( data, optimisticData = {} ) {
	return async function ( { registry, dispatch } ) {
		const { createErrorNotice, createSuccessNotice } = coreDispatch( globalNoticesStore );

		const tempId = `new-${ ++uniqueId }`;

		try {
			const path = `/jetpack/v4/social/connections/`;

			dispatch(
				addConnection( {
					connection_id: tempId,
					...optimisticData,
				} )
			);
			// Mark the connection as updating to show the spinner.
			dispatch( updatingConnection( tempId ) );

			/**
			 * @type {import('../types').Connection}
			 */
			const connection = await apiFetch( { method: 'POST', path, data } );

			if ( connection ) {
				dispatch(
					// Updating the connection will also override the connection_id.
					updateConnection( tempId, {
						...connection,
						can_disconnect: true,
						// For editor, we always enable the connection by default.
						enabled: true,
					} )
				);

				createSuccessNotice(
					sprintf(
						/* translators: %s is the name of the social media platform e.g. "Facebook" */
						__( '%s account connected successfully.', 'jetpack' ),
						connection.label
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
			let message = __( 'Error connecting account.', 'jetpack' );

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
 * @param {string} connectionId - Connection ID to update.
 * @param {Record<string, any>} data - The data.
 *
 * @returns {object} Delete connection action.
 */
export function updateConnection( connectionId, data ) {
	return {
		type: UPDATE_CONNECTION,
		connectionId,
		data,
	};
}

/**
 * Marks a connection as being updating.
 *
 * @param {string} connectionId - Connection ID being updated.
 * @param {boolean} updating - Whether the connection is being updated.
 *
 * @returns {object} Deleting connection action.
 */
export function updatingConnection( connectionId, updating = true ) {
	return {
		type: UPDATING_CONNECTION,
		connectionId,
		updating,
	};
}

/**
 * Updates a connection.
 *
 * @param {string} connectionId - Connection ID to update.
 * @param {Record<string, any>} data - The data for API call.
 * @returns {void}
 */
export function updateConnectionById( connectionId, data ) {
	return async function ( { dispatch, select } ) {
		const { createErrorNotice, createSuccessNotice } = coreDispatch( globalNoticesStore );

		const prevConnection = select.getConnectionById( connectionId );

		try {
			const path = `/jetpack/v4/social/connections/${ connectionId }`;

			// Optimistically update the connection.
			dispatch( updateConnection( connectionId, data ) );

			dispatch( updatingConnection( connectionId ) );

			const connection = await apiFetch( { method: 'POST', path, data } );

			if ( connection ) {
				createSuccessNotice( __( 'Account updated successfully.', 'jetpack' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			}
		} catch ( error ) {
			let message = __( 'Error updating account.', 'jetpack' );

			if ( typeof error === 'object' && 'message' in error && error.message ) {
				message = `${ message } ${ error.message }`;
			}

			// Revert the connection to its previous state.
			dispatch( updateConnection( connectionId, prevConnection ) );

			createErrorNotice( message, { type: 'snackbar', isDismissible: true } );
		} finally {
			dispatch( updatingConnection( connectionId, false ) );
		}
	};
}

/**
 * Toggles the connections modal.
 *
 * @param {boolean} isOpen - Whether the modal is open.
 *
 * @returns {object} - An action object.
 */
export function toggleConnectionsModal( isOpen ) {
	return {
		type: TOGGLE_CONNECTIONS_MODAL,
		isOpen,
	};
}

/**
 * Opens the connections modal.
 *
 * @returns {object} - An action object.
 */
export function openConnectionsModal() {
	return toggleConnectionsModal( true );
}

/**
 * Closes the connections modal.
 * @returns {object} - An action object.
 */
export function closeConnectionsModal() {
	return toggleConnectionsModal( false );
}
