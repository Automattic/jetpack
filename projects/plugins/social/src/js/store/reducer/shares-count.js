import { SET_SHARES_COUNT } from '../actions/shares-count';

const sharesCount = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_SHARES_COUNT:
			return {
				...state,
				...action.sharesCount,
			};
	}
	return state;
};

export default sharesCount;
