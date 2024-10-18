import { checkConnectionCode } from '../../utils/connections';
import { REQUEST_TYPE_DEFAULT } from '../actions/constants';

/**
 * Returns the connections list from the store.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @return {Array<import("../types").Connection>} The connections list
 */
export function getConnections( state ) {
	return state.connectionData?.connections ?? [];
}

/**
 * Return a connection by its ID.
 *
 * @param {import("../types").SocialStoreState} state        - State object.
 * @param {string}                              connectionId - The connection ID.
 *
 * @return {import("../types").Connection | undefined} The connection.
 */
export function getConnectionById( state, connectionId ) {
	return getConnections( state ).find( connection => connection.connection_id === connectionId );
}

/**
 * Returns the broken connections.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @return {Array<import("../types").Connection>} List of broken connections.
 */
export function getBrokenConnections( state ) {
	return getConnections( state ).filter( connection => {
		return (
			connection.status === 'broken' ||
			// This is a legacy check for connections that are not healthy.
			// TODO remove this check when we are sure that all connections have
			// the status property (same schema for connections endpoints), e.g. on Simple/Atomic sites
			checkConnectionCode( connection, 'broken' )
		);
	} );
}

/**
 * Returns connections by service name/ID.
 *
 * @param {import("../types").SocialStoreState} state       - State object.
 * @param {string}                              serviceName - The service name.
 *
 * @return {Array<import("../types").Connections>} The connections.
 */
export function getConnectionsByService( state, serviceName ) {
	return getConnections( state ).filter( ( { service_name } ) => service_name === serviceName );
}

/**
 * Returns whether there are connections in the store.
 * @param {import("../types").SocialStoreState} state - State object.
 * @return {boolean} Whether there are connections.
 */
export function hasConnections( state ) {
	return getConnections( state ).length > 0;
}

/**
 * Returns the failed Publicize connections.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @return {Array<import("../types").Connection>} List of connections.
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
 * @return {Array<import("../types").Connection>} List of service names that need reauthentication.
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
 * @return {Array<import("../types").Connection>} List of enabled connections.
 */
export function getEnabledConnections( state ) {
	return getConnections( state ).filter( connection => connection.enabled );
}

/**
 * Returns the Publicize connections that are disabled.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @return {Array<import("../types").Connection>} List of disabled connections.
 */
export function getDisabledConnections( state ) {
	return getConnections( state ).filter( connection => ! connection.enabled );
}

/**
 * Get the profile details for a connection
 *
 * @param {import("../types").SocialStoreState} state              - State object.
 * @param {string}                              service            - The service name.
 * @param {object}                              args               - Arguments.
 * @param {boolean}                             args.forceDefaults - Whether to use default values.
 *
 * @return {object} The profile details.
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
			const {
				display_name,
				profile_display_name,
				profile_picture,
				external_display,
				external_name,
			} = connection;

			displayName = 'twitter' === service ? profile_display_name : display_name || external_display;
			username = 'twitter' === service ? display_name : connection.username;
			profileImage = profile_picture;

			// Connections schema is a mess
			if ( 'bluesky' === service ) {
				username = external_name;
			}
		}
	}

	return { displayName, profileImage, username };
}

/**
 * Get the connections being deleted.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @return {import("../types").ConnectionData['deletingConnections']} The connection being deleted.
 */
export function getDeletingConnections( state ) {
	return state.connectionData?.deletingConnections ?? [];
}

/**
 * Get the connections being updated.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @return {import("../types").ConnectionData['updatingConnections']} The connection being updated.
 */
export function getUpdatingConnections( state ) {
	return state.connectionData?.updatingConnections ?? [];
}

/**
 * Get the account being reconnected
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @return {import("../types").ConnectionData['reconnectingAccount']} The account being reconnected.
 */
export function getReconnectingAccount( state ) {
	return state.connectionData?.reconnectingAccount ?? '';
}

/**
 * Get the abort controllers for a specific request type.
 *
 * @param {import("../types").SocialStoreState} state       - State object.
 * @param {string}                              requestType - The request type.
 *
 * @return {Array<AbortController>} The abort controllers.
 */
export function getAbortControllers( state, requestType = REQUEST_TYPE_DEFAULT ) {
	return state.connectionData?.abortControllers?.[ requestType ] ?? [];
}

/**
 * Whether a mastodon account is already connected.
 *
 * @param {import("../types").SocialStoreState} state    - State object.
 * @param {string}                              username - The mastodon username.
 *
 * @return {boolean} Whether the mastodon account is already connected.
 */
export function isMastodonAccountAlreadyConnected( state, username ) {
	return getConnectionsByService( state, 'mastodon' ).some( connection => {
		return connection.external_display === username;
	} );
}

/**
 * Whether a Bluesky account is already connected.
 *
 * @param {import("../types").SocialStoreState} state  - State object.
 * @param {string}                              handle - The Bluesky handle.
 *
 * @return {boolean} Whether the Bluesky account is already connected.
 */
export function isBlueskyAccountAlreadyConnected( state, handle ) {
	return getConnectionsByService( state, 'bluesky' ).some( connection => {
		return connection.external_name === handle;
	} );
}

/**
 * Returns the latest KeyringResult from the store.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @return {import("../types").KeyringResult} The KeyringResult
 */
export function getKeyringResult( state ) {
	return state.connectionData?.keyringResult;
}

/**
 * Whether the connections modal is open.
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @return {boolean} Whether the connections modal is open.
 */
export function isConnectionsModalOpen( state ) {
	return state.connectionData?.isConnectionsModalOpen ?? false;
}
