import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { select, dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Effect handler which will refresh the connection test results.
 *
 * @returns {object} Refresh connection test results action.
 */
export async function refreshConnectionTestResults() {
	try {
		const jetpackSocialData = getJetpackData()?.social || {};
		const connectionRefreshPath =
			jetpackSocialData.connectionRefreshPath ?? '/wpcom/v2/publicize/connection-test-results';
		const results = await apiFetch( { path: connectionRefreshPath } );

		// Combine current connections with new connections.
		const prevConnections = select( 'jetpack/publicize' ).getConnections();
		const freshConnections = results;
		const connections = [];
		const defaults = {
			done: false,
			enabled: Boolean( jetpackSocialData.sharesData?.shares_remaining ),
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
			const { done, enabled, toggleable } = prevConnection ?? defaults;
			const connection = {
				display_name: freshConnection.display_name,
				username: freshConnection.username,
				service_name: freshConnection.service_name,
				id: freshConnection.id,
				profile_picture: freshConnection.profile_picture,
				done,
				enabled,
				toggleable,
				is_healthy: freshConnection.test_success,
				error_code: freshConnection.error_code,
				connection_id: freshConnection.connection_id,
			};

			connections.push( connection );
		}

		// Update post metadata.
		return dispatch( editorStore ).editPost( { jetpack_publicize_connections: connections } );
	} catch ( error ) {
		// Refreshing connections failed
	}
}

/**
 * Effect handler which will update the connections
 * in the post metadata.
 *
 * @param {object} action              - Action which had initiated the effect handler.
 * @param {string} action.connectionId - Connection ID to switch.
 * @returns {object} Switch connection enable-status action.
 */
export async function toggleConnectionById( { connectionId } ) {
	const connections = select( 'jetpack/publicize' ).getConnections();

	/*
	 * Map connections re-defining the enabled state of the connection,
	 * based on the connection ID.
	 */
	const updatedConnections = connections.map( connection => ( {
		...connection,
		enabled: (
			connection.connection_id
				? connection.connection_id === connectionId
				: connection.id === connectionId
		)
			? ! connection.enabled
			: connection.enabled,
	} ) );

	// Update post metadata.
	return dispatch( editorStore ).editPost( { jetpack_publicize_connections: updatedConnections } );
}

/**
 * Effect handler to toggle and store Post Share enable feature state.
 *
 * @returns {object} Updateting jetpack_publicize_feature_enabled post meta action.
 */
export async function togglePublicizeFeature() {
	const isPublicizeFeatureEnabled = select( 'jetpack/publicize' ).getFeatureEnableState();
	return dispatch( editorStore ).editPost( {
		meta: { jetpack_publicize_feature_enabled: ! isPublicizeFeatureEnabled },
	} );
}

export default {
	REFRESH_CONNECTION_TEST_RESULTS: refreshConnectionTestResults,
	TOGGLE_CONNECTION_BY_ID: toggleConnectionById,
	TOGGLE_PUBLICIZE_FEATURE: togglePublicizeFeature,
};
