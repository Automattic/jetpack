import {
	DELETE_CONNECTION,
	DELETING_CONNECTION,
	SET_CONNECTIONS,
	TOGGLE_CONNECTION,
} from '../actions/constants';

const connectionData = ( state = {}, action ) => {
	switch ( action.type ) {
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
