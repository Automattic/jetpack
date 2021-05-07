/**
 * Internal dependencies
 */
import { CONNECTION_DATA_SET_AUTHORIZATION_URL } from '../actions/connection-data';

const settings = ( state = {}, action ) => {
	switch ( action.type ) {
		case CONNECTION_DATA_SET_AUTHORIZATION_URL:
			return {
				...state,
				authorizationUrl: action.url,
			};
	}

	return state;
};

export default settings;
