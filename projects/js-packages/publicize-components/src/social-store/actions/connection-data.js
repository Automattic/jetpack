import { globalNoticesStore } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { dispatch as coreDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	ADD_CONNECTION,
	CREATING_CONNECTION,
	DELETE_CONNECTION,
	DELETING_CONNECTION,
	SET_CONNECTIONS,
	TOGGLE_CONNECTION,
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
 * Whether a connection is being created.
 *
 * @param {boolean} creating - Whether the connection is being creating.
 * @returns {object} Creating connection action.
 */
export function creatingConnection( creating = true ) {
	return {
		type: CREATING_CONNECTION,
		creating,
	};
}

/**
 * Deletes a connection by disconnecting it.
 *
 * @param {object} args - Arguments.
 * @param {string | number} args.connectionId - Connection ID to delete.
 * @param {boolean} [args.showSuccessNotice] - Whether to show a success notice.
 *
 * @returns {void}
 */
export function deleteConnectionById( { connectionId, showSuccessNotice = true } ) {
	return async function ( { dispatch } ) {
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
		} catch ( error ) {
			let message = __( 'Error disconnecting account.', 'jetpack' );

			if ( typeof error === 'object' && 'message' in error && error.message ) {
				message = `${ message } ${ error.message }`;
			}

			createErrorNotice( message, { type: 'snackbar', isDismissible: true } );
		} finally {
			dispatch( deletingConnection( connectionId, false ) );
		}
	};
}

/**
 * Creates a connection.
 *
 * @param {Record<string, any>} data - The data for API call.
 * @returns {void}
 */
export function createConnection( data ) {
	return async function ( { dispatch } ) {
		const { createErrorNotice, createSuccessNotice } = coreDispatch( globalNoticesStore );

		try {
			const path = `/jetpack/v4/social/connections/`;

			dispatch( creatingConnection() );

			const connection = await apiFetch( { method: 'POST', path, data } );

			if ( connection ) {
				dispatch(
					addConnection( {
						...connection,
						// TODO fix this messy data structure
						connection_id: connection.ID.toString(),
						display_name: connection.external_display,
						service_name: connection.service,
						external_id: connection.external_ID,
						profile_link: connection.external_profile_URL,
						profile_picture: connection.external_profile_picture,
						can_disconnect: true,
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
			}
		} catch ( error ) {
			let message = __( 'Error connecting account.', 'jetpack' );

			if ( typeof error === 'object' && 'message' in error && error.message ) {
				message = `${ message } ${ error.message }`;
			}

			createErrorNotice( message, { type: 'snackbar', isDismissible: true } );
		} finally {
			dispatch( creatingConnection( false ) );
		}
	};
}
