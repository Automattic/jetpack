import { combineReducers } from 'redux';
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

const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_RECEIVE:
			return Object.assign( {}, action.modules );
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return Object.assign( {}, state, {
				[ action.module ]: Object.assign( {}, state[ action.module ], { activated: true } )
			} );
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return Object.assign( {}, action.modules, {
				[ action.module ]: Object.assign( {}, state[ action.module ], { activated: false } )
			} );
		default:
			return state;
	}
};

const requests = ( state = { fetchingModulesList: false, activating: {}, deactivating: {} }, action ) => {
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_FETCH:
			return Object.assign( {}, state, { fetchingModulesList: true} );
		case JETPACK_MODULES_LIST_FETCH_FAIL:
		case JETPACK_MODULES_LIST_RECEIVE:
			return Object.assign( {}, state, { fetchingModulesList: false} );
		case JETPACK_MODULE_ACTIVATE:
			return Object.assign( {}, state, {
				activating: Object.assign( {}, state.activating, {
					[ action.module ]: true
				}
			) } );
		case JETPACK_MODULE_ACTIVATE_FAIL:
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return Object.assign( {}, state, {
				activating: Object.assign( {}, state.activating, {
					[ action.module ]: false
				}
			) } );
		case JETPACK_MODULE_DEACTIVATE:
			return Object.assign( {}, state, {
				deactivating: Object.assign( {}, state.deactivating, {
					[ action.module ]: true
				}
			) } );
		case JETPACK_MODULE_DEACTIVATE_FAIL:
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return Object.assign( {}, state, {
				deactivating: Object.assign( {}, state.deactivating, {
					[ action.module ]: false
				}
			) } );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests
} );
