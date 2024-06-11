/**
 * Returns the connections list from the store.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @returns {Array<import("../types").Connection>} The connections list
 */
export function getConnections( state ) {
	return state.connectionData?.connections ?? [];
}

/**
 * Return a connection by its ID.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @param {string} connectionId - The connection ID.
 *
 * @returns {import("../types").Connection | undefined} The connection.
 */
export function getConnectionById( state, connectionId ) {
	return getConnections( state ).find( connection => connection.connection_id === connectionId );
}

/**
 * Returns connections by service name/ID.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @param {string} serviceName - The service name.
 *
 * @returns {Array<import("../types").Connections>} The connections.
 */
export function getConnectionsByService( state, serviceName ) {
	return getConnections( state ).filter( ( { service_name } ) => service_name === serviceName );
}

/**
 * Returns the connections admin URL from the store.
 * @param {import("../types").SocialStoreState} state - State object.
 * @returns {string|null} The connections admin URL.
 */
export function getConnectionsAdminUrl( state ) {
	return state.connectionData?.adminUrl ?? null;
}

/**
 * Returns whether there are connections in the store.
 * @param {import("../types").SocialStoreState} state - State object.
 * @returns {boolean} Whether there are connections.
 */
export function hasConnections( state ) {
	return getConnections( state ).length > 0;
}

/**
 * Returns the failed Publicize connections.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @returns {Array<import("../types").Connection>} List of connections.
 */
export function getFailedConnections( state ) {
	const connections = getConnections( state );

	return connections.filter( connection => false === connection.test_success );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * iFor example, when LinkedIn switched its API from v1 to v2.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @returns {Array<import("../types").Connection>} List of service names that need reauthentication.
 */
export function getMustReauthConnections( state ) {
	const connections = getConnections( state );
	return connections
		.filter( connection => 'must_reauth' === connection.test_success )
		.map( connection => connection.service_name );
}

/**
 * Returns the Publicize connections that are enabled.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @returns {Array<import("../types").Connection>} List of enabled connections.
 */
export function getEnabledConnections( state ) {
	return getConnections( state ).filter( connection => connection.enabled );
}

/**
 * Returns the Publicize connections that are disabled.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @returns {Array<import("../types").Connection>} List of disabled connections.
 */
export function getDisabledConnections( state ) {
	return getConnections( state ).filter( connection => ! connection.enabled );
}

/**
 * Get the profile details for a connection
 *
 * @param {import("../types").SocialStoreState} state - State object.
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

/**
 * Get the connections being deleted.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @returns {import("../types").ConnectionData['deletingConnections']} The connection being deleted.
 */
export function getDeletingConnections( state ) {
	return state.connectionData?.deletingConnections ?? [];
}

/**
 * Get the connections being updated.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @returns {import("../types").ConnectionData['updatingConnections']} The connection being updated.
 */
export function getUpdatingConnections( state ) {
	return state.connectionData?.updatingConnections ?? [];
}

/**
 * Whether a mastodon account is already connected.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @param {string} username - The mastodon username.
 *
 * @returns {boolean} Whether the mastodon account is already connected.
 */
export function isMastodonAccountAlreadyConnected( state, username ) {
	return getConnectionsByService( state, 'mastodon' ).some( connection => {
		return connection.external_display === username;
	} );
}

/**
 * Returns the services list from the store.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @returns {Array<import("../types").ConnectionService>} The services list
 */
export function getServices( state ) {
	return state.connectionData?.services ?? [];
}

/**
 * Returns the latest KeyringResult from the store.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @returns {import("../types").KeyringResult} The KeyringResult
 */
export function getKeyringResult( state ) {
	return state.connectionData?.keyringResult;
}

/**
 * Whether the connections modal is open.
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @returns {boolean} Whether the connections modal is open.
 */
export function isConnectionsModalOpen( state ) {
	return state.connectionData?.isConnectionsModalOpen ?? false;
}
