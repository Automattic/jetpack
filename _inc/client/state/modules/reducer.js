
import {
	JETPACK_MODULES_LIST_FETCH,
	JETPACK_MODULES_LIST_FETCH_FAIL,
	JETPACK_MODULES_LIST_RECEIVE,
	JETPACK_MODULE_FETCH,
	JETPACK_MODULE_FETCH_FAIL,
	JETPACK_MODULE_RECEIVE,
	JETPACK_MODULE_ACTIVATE,
	JETPACK_MODULE_ACTIVATE_FAIL,
	JETPACK_MODULE_ACTIVATE_SUCCESS,
	JETPACK_MODULE_DEACTIVATE,
	JETPACK_MODULE_DEACTIVATE_FAIL,
	JETPACK_MODULE_DEACTIVATE_SUCCESS

} from 'state/action-types';

const initialState = require( 'state/sample-state-tree.js' );

export const reducer = ( state = initialState.modules, action ) => {
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_RECEIVE:
			return Object.assign( {}, action.modules, { isLoading: false } );
		case JETPACK_MODULES_LIST_FETCH:
			return Object.assign( {}, action.modules, { isLoading: true } );
		case JETPACK_MODULES_LIST_FETCH_FAIL:
			return Object.assign( {}, { isLoading: false } );
		case JETPACK_MODULE_ACTIVATE:
			return Object.assign( {}, action.modules, {
				[ slug ]: Object.assign( {}, state.modules[ slug ], { activated: true } )
			} );
		case JETPACK_MODULE_DEACTIVATE:
			return Object.assign( {}, action.modules, {
				[ slug ]: Object.assign( {}, state.modules[ slug ], { activated: true } )
			} );
		default:
			return state;
	}
}
