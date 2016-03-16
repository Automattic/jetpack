
import { JETPACK_MODULES_LIST_RECEIVE } from './actions';


const initialState = {
	installed: []
};

export const reducer = (state = initialState, action ) => {
	let _state;
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_RECEIVE:
			return state;
		default:
			return state;
	}
}
