import { getScriptData } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { REQUEST_TYPE_DEFAULT } from '../actions/constants';
import type { Connection, SocialStoreState } from '../types';

/**
 * Returns the connections list from the store.
 *
 * @param state - State object.
 *
 * @return The connections list
 */
export function getConnections( state: SocialStoreState ) {
	return state.connectionData?.connections ?? [];
}

/**
 * Return a connection by its ID.
 *
 * @param state        - State object.
 * @param connectionId - The connection ID.
 *
 * @return The connection.
 */
export function getConnectionById(
	state: SocialStoreState,
	connectionId: string
): Connection | undefined {
	return getConnections( state ).find( connection => connection.connection_id === connectionId );
}

/**
 * Returns the broken connections.
 *
 * @param state - State object.
 * @return List of broken connections.
 */
export function getBrokenConnections( state: SocialStoreState ) {
	return getConnections( state ).filter( connection => {
		return connection.status === 'broken';
	} );
}

/**
 * Returns connections by service name/ID.
 *
 * @param state       - State object.
 * @param serviceName - The service name.
 *
 * @return  The connections.
 */
export function getConnectionsByService( state: SocialStoreState, serviceName: string ) {
	return getConnections( state ).filter( ( { service_name } ) => service_name === serviceName );
}

/**
 * Returns whether there are connections in the store.
 * @param state - State object.
 * @return Whether there are connections.
 */
export function hasConnections( state: SocialStoreState ) {
	return getConnections( state ).length > 0;
}

/**
 * Returns the failed Publicize connections.
 *
 * @param state - State object.
 * @return List of connections.
 */
export function getFailedConnections( state: SocialStoreState ) {
	const connections = getConnections( state );

	return connections.filter( connection => 'broken' === connection.status );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * For example, when LinkedIn switched its API from v1 to v2.
 *
 * @param state - State object.
 * @return List of service names that need reauthentication.
 */
export function getMustReauthConnections( state: SocialStoreState ) {
	const connections = getConnections( state );
	return connections
		.filter( connection => 'must_reauth' === connection.status )
		.map( connection => connection.service_name );
}

/**
 * Returns the Publicize connections that are enabled.
 *
 * @param state - State object.
 *
 * @return List of enabled connections.
 */
export function getEnabledConnections( state: SocialStoreState ) {
	return getConnections( state ).filter( connection => connection.enabled );
}

/**
 * Returns the Publicize connections that are disabled.
 *
 * @param state - State object.
 *
 * @return List of disabled connections.
 */
export function getDisabledConnections( state: SocialStoreState ) {
	return getConnections( state ).filter( connection => ! connection.enabled );
}

/**
 * Get the profile details for a connection
 *
 * @param state              - State object.
 * @param service            - The service name.
 * @param args               - Arguments.
 * @param args.forceDefaults - Whether to use default values.
 *
 * @return The profile details.
 */
export function getConnectionProfileDetails(
	state: SocialStoreState,
	service: string,
	{ forceDefaults = false }: { forceDefaults?: boolean } = {}
) {
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
 * @param state - State object.
 * @return The connection being deleted.
 */
export function getDeletingConnections( state: SocialStoreState ) {
	return state.connectionData?.deletingConnections ?? [];
}

/**
 * Get the connections being updated.
 *
 * @param state - State object.
 * @return The connection being updated.
 */
export function getUpdatingConnections( state: SocialStoreState ) {
	return state.connectionData?.updatingConnections ?? [];
}

/**
 * Get the account being reconnected
 *
 * @param state - State object.
 * @return The account being reconnected.
 */
export function getReconnectingAccount( state: SocialStoreState ) {
	return state.connectionData?.reconnectingAccount;
}

/**
 * Get the abort controllers for a specific request type.
 *
 * @param state       - State object.
 * @param requestType - The request type.
 *
 * @return  The abort controllers.
 */
export function getAbortControllers( state: SocialStoreState, requestType = REQUEST_TYPE_DEFAULT ) {
	return state.connectionData?.abortControllers?.[ requestType ] ?? [];
}

/**
 * Whether a mastodon account is already connected.
 *
 * @param state  - State object.
 * @param handle - The mastodon handle.
 *
 * @return Whether the mastodon account is already connected.
 */
export function isMastodonAccountAlreadyConnected( state: SocialStoreState, handle: string ) {
	return getConnectionsByService( state, 'mastodon' ).some( connection => {
		return connection.external_handle === handle;
	} );
}

/**
 * Whether a Bluesky account is already connected.
 *
 * @param state  - State object.
 * @param handle - The Bluesky handle.
 *
 * @return Whether the Bluesky account is already connected.
 */
export function isBlueskyAccountAlreadyConnected( state: SocialStoreState, handle: string ) {
	return getConnectionsByService( state, 'bluesky' ).some( connection => {
		return connection.external_handle === handle;
	} );
}

/**
 * Returns the latest KeyringResult from the store.
 *
 * @param state - State object.
 *
 * @return The KeyringResult
 */
export function getKeyringResult( state: SocialStoreState ) {
	return state.connectionData?.keyringResult;
}

/**
 * Whether the connections modal is open.
 * @param state - State object.
 *
 * @return Whether the connections modal is open.
 */
export function isConnectionsModalOpen( state: SocialStoreState ) {
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

			const { getUser } = select( coreStore );

			// The user has to be at least an editor to manage the connection.
			// @ts-expect-error User object types are wrong, capabilities are boolean, not string.
			// See https://github.com/WordPress/gutenberg/pull/68045
			return getUser( current_user.id )?.capabilities?.edit_others_posts ?? false;
		}
);
