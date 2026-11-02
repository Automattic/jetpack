import { combineReducers } from '@wordpress/data';
import {
	SET_CONNECTION_STATUS,
	SET_CONNECTION_STATUS_IS_FETCHING,
	SET_SITE_IS_REGISTERING,
	SET_USER_IS_CONNECTING,
	DISCONNECT_USER_SUCCESS,
	CLEAR_REGISTRATION_ERROR,
	SET_REGISTRATION_ERROR,
	SET_AUTHORIZATION_URL,
	SET_CONNECTED_PLUGINS,
	SET_CONNECTION_ERRORS,
	SET_IS_OFFLINE_MODE,
	SET_CONNECTION_OWNER,
} from './actions';

const connectionStatus = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CONNECTION_STATUS:
			return { ...state, ...action.connectionStatus };
		case DISCONNECT_USER_SUCCESS:
			// A non-owner's unlink leaves the owner's token alone. `isActive` is the deprecated
			// spelling of `hasConnectedOwner` and the endpoint reports the same value for both.
			return {
				...state,
				isUserConnected: false,
				...( action.wasConnectionOwner ? { hasConnectedOwner: false, isActive: false } : {} ),
			};
	}

	return state;
};

const connectedPlugins = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CONNECTED_PLUGINS:
			return action.connectedPlugins;
	}

	return state;
};

const connectionStatusIsFetching = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_CONNECTION_STATUS_IS_FETCHING:
			return action.isFetching;
	}

	return state;
};

const siteIsRegistering = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_SITE_IS_REGISTERING:
			return action.isRegistering;
	}

	return state;
};

const userIsConnecting = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_USER_IS_CONNECTING:
			return action.isConnecting;
	}

	return state;
};

const registrationError = ( state, action ) => {
	switch ( action.type ) {
		case CLEAR_REGISTRATION_ERROR:
			return false;
		case SET_REGISTRATION_ERROR:
			return action.registrationError;
		default:
			return state;
	}
};

const authorizationUrl = ( state, action ) => {
	switch ( action.type ) {
		case SET_AUTHORIZATION_URL:
			return action.authorizationUrl;
		default:
			return state;
	}
};

const userConnectionData = ( state, action ) => {
	switch ( action.type ) {
		case DISCONNECT_USER_SUCCESS:
			// Matches what the endpoint reports once the token is gone: no WordPress.com identity
			// to show, and no mismatch to report about a user who is no longer connected.
			return {
				...state,
				currentUser: {
					...state?.currentUser,
					isConnected: false,
					wpcomUser: { avatar: false },
					possibleAccountErrors: {},
					...( action.wasConnectionOwner ? { isMaster: false } : {} ),
				},
				...( action.wasConnectionOwner ? { connectionOwner: null } : {} ),
			};
		case SET_CONNECTION_OWNER:
			// Whoever transferred is no longer the owner: handing it to yourself is refused.
			return {
				...state,
				currentUser: { ...state?.currentUser, isMaster: false },
				connectionOwner: action.owner.displayName,
			};
		default:
			return state;
	}
};

const connectionOwner = ( state = null, action ) => {
	switch ( action.type ) {
		case DISCONNECT_USER_SUCCESS:
			// The owner's unlink deletes the master_user option, so there is no owner of record.
			return action.wasConnectionOwner ? null : state;
		case SET_CONNECTION_OWNER:
			return { id: action.owner.id, displayName: action.owner.displayName };
		default:
			return state;
	}
};

/*
 * Protected owner. The server sends these already decided, and nothing in the client changes
 * them, so each is a pass-through: `combineReducers` drops any key it has no reducer for, which
 * would leave the selectors reading `undefined` instead of what PHP put on the page.
 *
 * `null` is the initial value on purpose. The server withholds all three from a viewer who
 * cannot manage the connection, and "cannot say" must not read as "no".
 */
const hasProtectedOwner = ( state = null, action ) => {
	switch ( action.type ) {
		case SET_CONNECTION_OWNER:
			return null;
		default:
			return state;
	}
};

const requiresProtectedOwner = ( state = null ) => state;

const useDefaultProtectedOwnerUi = ( state = null ) => state;

const connectionErrors = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CONNECTION_ERRORS:
			return action.connectionErrors;
	}

	return state;
};

const isOfflineMode = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_IS_OFFLINE_MODE:
			return action.isOfflineMode;
	}

	return state;
};

const reducers = combineReducers( {
	connectionStatus,
	connectionStatusIsFetching,
	siteIsRegistering,
	userIsConnecting,
	registrationError,
	authorizationUrl,
	userConnectionData,
	connectedPlugins,
	connectionOwner,
	hasProtectedOwner,
	requiresProtectedOwner,
	useDefaultProtectedOwnerUi,
	connectionErrors,
	isOfflineMode,
} );

export default reducers;
