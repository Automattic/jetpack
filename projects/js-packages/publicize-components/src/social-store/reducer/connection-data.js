import {
	ADD_CONNECTION,
	CREATING_CONNECTION,
	DELETE_CONNECTION,
	DELETING_CONNECTION,
	SET_CONNECTIONS,
	TOGGLE_CONNECTION,
	UPDATE_CONNECTION,
	UPDATING_CONNECTION,
} from '../actions/constants';

const connectionData = ( state = {}, action ) => {
	switch ( action.type ) {
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
				connections: state.connections.filter( connection => {
					// If the connection has a connection_id, then give it priority.
					// Otherwise, use the id.
					const isTargetConnection = connection.connection_id
						? connection.connection_id === action.connectionId
						: connection.id === action.connectionId;

					return ! isTargetConnection;
				} ),
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

		case CREATING_CONNECTION:
			return {
				...state,
				creatingConnection: action.creating,
			};

		case UPDATE_CONNECTION:
			return {
				...state,
				connections: state.connections.map( connection => {
					// If the connection has a connection_id, then give it priority.
					// Otherwise, use the id.
					const isTargetConnection = connection.connection_id
						? connection.connection_id === action.connectionId
						: connection.id === action.connectionId;

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

		case TOGGLE_CONNECTION:
			return {
				...state,
				connections: state.connections.map( connection => {
					// If the connection has a connection_id, then give it priority.
					// Otherwise, use the id.
					const isTargetConnection = connection.connection_id
						? connection.connection_id === action.connectionId
						: connection.id === action.connectionId;

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
