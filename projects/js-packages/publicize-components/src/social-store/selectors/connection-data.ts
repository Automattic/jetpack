import { getScriptData } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { REQUEST_TYPE_DEFAULT } from '../actions/constants';
import { Connection, SocialStoreState } from '../types';

/**
 * Returns the connections list from the store.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 *
 * @return {Array<import("../types").Connection>} The connections list
 */
export function getConnections( state: SocialStoreState ) {
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
		return connection.status === 'broken';
	} );
}

/**
 * Returns connections by service name/ID.
 *
 * @param {import("../types").SocialStoreState} state       - State object.
 * @param {string}                              serviceName - The service name.
 *
 * @return {Array<import("../types").Connection>} The connections.
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

	return connections.filter( connection => 'broken' === connection.status );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * For example, when LinkedIn switched its API from v1 to v2.
 *
 * @param {import("../types").SocialStoreState} state - State object.
 * @return {Array<import("../types").Connection>} List of service names that need reauthentication.
 */
export function getMustReauthConnections( state ) {
	const connections = getConnections( state );
	return connections
		.filter( connection => 'must_reauth' === connection.status )
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
			const { display_name, profile_picture, external_handle } = connection;

			displayName = display_name;
			username = external_handle;
			profileImage = profile_picture;
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
	return state.connectionData?.reconnectingAccount;
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
 * @param {import("../types").SocialStoreState} state  - State object.
 * @param {string}                              handle - The mastodon handle.
 *
 * @return {boolean} Whether the mastodon account is already connected.
 */
export function isMastodonAccountAlreadyConnected( state, handle ) {
	return getConnectionsByService( state, 'mastodon' ).some( connection => {
		return connection.external_handle === handle;
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
		return connection.external_handle === handle;
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

/**
 * Whether the current user can manage the connection.
 */
export const canUserManageConnection = createRegistrySelector(
	select =>
		( state: SocialStoreState, connectionOrId: Connection | string ): boolean => {
			const connection =
				typeof connectionOrId === 'string'
					? getConnectionById( state, connectionOrId )
					: connectionOrId;

			const { current_user } = getScriptData().user;

			// If the current user is the connection owner.
			if ( current_user.wpcom?.ID === connection.wpcom_user_id ) {
				return true;
			}

			const {
				// @ts-expect-error getUser exists but `core-data` entities are not typed properly.
				// Should work fine after https://github.com/WordPress/gutenberg/pull/67668 is released to npm.
				getUser,
			} = select( coreStore );

			// The user has to be at least an editor to manage the connection.
			return getUser( current_user.id )?.capabilities?.edit_others_posts ?? false;
		}
);
