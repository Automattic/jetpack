import { globalNoticesStore } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { dispatch as coreDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import {
	DELETE_CONNECTION,
	DELETING_CONNECTION,
	SET_CONNECTIONS,
	TOGGLE_CONNECTION,
} from './constants';

/**
 * Set connections list
 * @param {Array} connections - list of connections
 * @returns {object} - an action object.
 */
export function setConnections( connections ) {
	return {
		type: SET_CONNECTIONS,
		connections,
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
