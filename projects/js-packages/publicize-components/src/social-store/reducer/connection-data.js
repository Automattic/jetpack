import { SET_CONNECTIONS, TOGGLE_CONNECTION } from '../actions/constants';

const connectionData = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CONNECTIONS:
			return {
				...state,
				connections: action.connections,
			};

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
