import { combineReducers } from 'redux';
import { reducer as modules } from 'state/modules';

// const genericReducer = ( state = initialState, action ) => state;

const genericReducer = combineReducers( {
	modules
} );

export default combineReducers( {
	jetpack: genericReducer
} );
