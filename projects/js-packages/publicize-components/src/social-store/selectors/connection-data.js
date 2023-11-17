/**
 * Returns the connections object from the store.
 *
 * @param {object} state - State object.
 *
 * @returns {Array} The connections list
 */
export function getConnections( state ) {
	return state.connectionData?.connections ?? [];
}

/**
 * Returns the connections admin URL from the store.
 * @param {object} state - State object.
 * @returns {string|null} The connections admin URL.
 */
export function getConnectionsAdminUrl( state ) {
	return state.connectionData?.adminUrl ?? null;
}

/**
 * Returns whether there are connections in the store.
 * @param {object} state - State object.
 * @returns {boolean} Whether there are connections.
 */
export function hasConnections( state ) {
	return getConnections( state ).length > 0;
}

/**
 * Returns the failed Publicize connections.
 *
 * @param {object} state - State object.
 * @returns {Array} List of connections.
 */
export function getFailedConnections( state ) {
	const connections = getConnections( state );

	return connections.filter( connection => false === connection.test_success );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * iFor example, when LinkedIn switched its API from v1 to v2.
 *
 * @param {object} state - State object.
 * @returns {Array} List of service names that need reauthentication.
 */
export function getMustReauthConnections( state ) {
	const connections = getConnections( state );
	return connections
		.filter( connection => 'must_reauth' === connection.test_success )
		.map( connection => connection.service_name );
}

/**
 * Get the profile details for a connection
 *
 * @param {object} state - State object.
 * @param {string} service - The service name.
 * @param {object} args - Arguments.
 * @param {boolean} args.forceDefaults - Whether to use default values.
 *
 * @returns {object} The profile details.
 */
export function getConnectionProfileDetails( state, service, { forceDefaults = false } = {} ) {
	let displayName = '';
	let profileImage = '';
	let username = '';

	if ( ! forceDefaults ) {
		const connection = getConnections( state ).find(
			( { service_name } ) => service === service_name
		);

		if ( connection ) {
			const { display_name, profile_display_name, profile_picture } = connection;

			displayName = 'twitter' === service ? profile_display_name : display_name;
			username = 'twitter' === service ? display_name : connection.username;
			profileImage = profile_picture;
		}
	}

	return { displayName, profileImage, username };
}
