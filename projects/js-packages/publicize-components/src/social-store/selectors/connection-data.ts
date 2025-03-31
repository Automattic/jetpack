import { getScriptData } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector, createSelector } from '@wordpress/data';
import { REQUEST_TYPE_DEFAULT } from '../actions/constants';
import { EMPTY_ARRAY } from '../constants';
import type { Connection, ConnectionData, SocialStoreState } from '../types';

/**
 * Returns the connections list from the store.
 *
 * @param state - State object.
 *
 * @return The connections list
 */
export function getConnections( state: SocialStoreState ): Array< Connection > {
	return state.connectionData?.connections ?? EMPTY_ARRAY;
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
export const getBrokenConnections = createSelector(
	( state: SocialStoreState ) => {
		const connections = getConnections( state );

		return connections.filter( connection => 'broken' === connection.status );
	},
	( state: SocialStoreState ) => [ state.connectionData?.connections ]
);

/**
 * Returns connections by service name/ID.
 *
 * @param state       - State object.
 * @param serviceName - The service name.
 *
 * @return  The connections.
 */
export const getConnectionsByService = createSelector(
	( state: SocialStoreState, serviceName: string ) => {
		return getConnections( state ).filter( ( { service_name } ) => service_name === serviceName );
	},
	( state: SocialStoreState ) => [ state.connectionData?.connections ]
);

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
export const getFailedConnections = createSelector(
	( state: SocialStoreState ) => {
		const connections = getConnections( state );

		return connections.filter( connection => 'broken' === connection.status );
	},
	( state: SocialStoreState ) => [ state.connectionData?.connections ]
);

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * For example, when LinkedIn switched its API from v1 to v2.
 *
 * @param state - State object.
 * @return List of service names that need reauthentication.
 */
export const getMustReauthConnections = createSelector(
	( state: SocialStoreState ) => {
		const connections = getConnections( state );
		return connections
			.filter( connection => 'must_reauth' === connection.status )
			.map( connection => connection.service_name );
	},
	( state: SocialStoreState ) => [ state.connectionData?.connections ]
);

/**
 * Returns the Publicize connections that are enabled.
 *
 * @param state - State object.
 *
 * @return List of enabled connections.
 */
export const getEnabledConnections = createSelector(
	( state: SocialStoreState ) => {
		return getConnections( state ).filter( connection => connection.enabled );
	},
	( state: SocialStoreState ) => [ state.connectionData?.connections ]
);

/**
 * Returns the Publicize connections that are disabled.
 *
 * @param state - State object.
 *
 * @return List of disabled connections.
 */
export const getDisabledConnections = createSelector(
	( state: SocialStoreState ) => {
		return getConnections( state ).filter( connection => ! connection.enabled );
	},
	( state: SocialStoreState ) => [ state.connectionData?.connections ]
);

/**
 * Get the connections being deleted.
 *
 * @param state - State object.
 * @return The connection being deleted.
 */
export function getDeletingConnections(
	state: SocialStoreState
): ConnectionData[ 'deletingConnections' ] {
	return state.connectionData?.deletingConnections ?? EMPTY_ARRAY;
}

/**
 * Get the connections being updated.
 *
 * @param state - State object.
 * @return The connection being updated.
 */
export function getUpdatingConnections(
	state: SocialStoreState
): ConnectionData[ 'updatingConnections' ] {
	return state.connectionData?.updatingConnections ?? EMPTY_ARRAY;
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
export function getAbortControllers(
	state: SocialStoreState,
	requestType = REQUEST_TYPE_DEFAULT
): Array< AbortController > {
	return state.connectionData?.abortControllers?.[ requestType ] ?? EMPTY_ARRAY;
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
