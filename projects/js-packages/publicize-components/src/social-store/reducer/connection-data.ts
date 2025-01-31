import {
	ADD_CONNECTION,
	DELETE_CONNECTION,
	DELETING_CONNECTION,
	SET_RECONNECTING_ACCOUNT,
	SET_CONNECTIONS,
	SET_KEYRING_RESULT,
	TOGGLE_CONNECTION,
	TOGGLE_CONNECTIONS_MODAL,
	UPDATE_CONNECTION,
	UPDATING_CONNECTION,
	ADD_ABORT_CONTROLLER,
	REMOVE_ABORT_CONTROLLERS,
	REQUEST_TYPE_DEFAULT,
} from '../actions/constants';
import { ConnectionData } from '../types';

/**
 * Connection data reducer
 *
 * @param {import('../types').ConnectionData} state  - Current state.
 * @param {object}                            action - Action object.
 * @return {import('../types').ConnectionData} The new state.
 */
const connectionData = ( state: ConnectionData = { connections: [] }, action ) => {
	switch ( action.type ) {
		case TOGGLE_CONNECTIONS_MODAL:
			return {
				...state,
				isConnectionsModalOpen: action.isOpen,
			};
		case ADD_CONNECTION:
			return {
				...state,
				connections: [ ...state.connections, action.connection ],
			};

		case SET_CONNECTIONS:
			return {
				...state,
				connections: action.connections,
			};

		case DELETE_CONNECTION:
			return {
				...state,
				connections: state.connections.filter(
					( { connection_id } ) => connection_id !== action.connectionId
				),
			};

		case DELETING_CONNECTION: {
			const deleting = new Set( state.deletingConnections );
			action.deleting
				? deleting.add( action.connectionId )
				: deleting.delete( action.connectionId );

			return {
				...state,
				deletingConnections: [ ...deleting ],
			};
		}

		case SET_RECONNECTING_ACCOUNT: {
			return {
				...state,
				reconnectingAccount: action.reconnectingAccount,
			};
		}

		case UPDATE_CONNECTION:
			return {
				...state,
				connections: state.connections.map( connection => {
					const isTargetConnection = connection.connection_id === action.connectionId;

					if ( isTargetConnection ) {
						return {
							...connection,
							...action.data,
						};
					}
					return connection;
				} ),
			};

		case UPDATING_CONNECTION: {
			const updating = new Set( state.updatingConnections );
			action.updating
				? updating.add( action.connectionId )
				: updating.delete( action.connectionId );

			return {
				...state,
				updatingConnections: [ ...updating ],
			};
		}

		case ADD_ABORT_CONTROLLER: {
			const requestType = action.requestType || REQUEST_TYPE_DEFAULT;

			return {
				...state,
				abortControllers: {
					...state.abortControllers,
					[ requestType ]: [
						...( state.abortControllers?.[ requestType ] || [] ),
						action.abortController,
					],
				},
			};
		}

		case REMOVE_ABORT_CONTROLLERS: {
			const requestType = action.requestType || REQUEST_TYPE_DEFAULT;

			return {
				...state,
				abortControllers: {
					...state.abortControllers,
					[ requestType ]: [],
				},
			};
		}

		case SET_KEYRING_RESULT:
			return {
				...state,
				keyringResult: action.keyringResult,
			};

		case TOGGLE_CONNECTION:
			return {
				...state,
				connections: state.connections.map( connection => {
					const isTargetConnection = connection.connection_id === action.connectionId;

					if ( isTargetConnection ) {
						return {
							...connection,
							enabled: ! connection.enabled,
						};
					}
					return connection;
				} ),
			};
	}
	return state;
};

export default connectionData;
