/**
 * Internal dependencies
 */
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
	JETPACK_MODULE_DEACTIVATE_SUCCESS,
	JETPACK_MODULE_UPDATE_OPTION,
	JETPACK_MODULE_UPDATE_OPTION_FAIL,
	JETPACK_MODULE_UPDATE_OPTION_SUCCESS,

} from 'state/action-types';
import restApi from 'rest-api';

export const fetchModules = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULES_LIST_FETCH
		} );
		return restApi.fetchModules().then( modules => {
			dispatch( {
				type: JETPACK_MODULES_LIST_RECEIVE,
				modules: modules
			} );
			return modules;
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULES_LIST_FETCH_FAIL,
				error: error
			} );
		} );
	}
}

export const fetchModule = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULE_FETCH
		} );
		return restApi.fetchModule().then( data => {
			dispatch( {
				type: JETPACK_MODULE_RECEIVE,
				module: data
			} );
			return data;
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_FETCH_FAIL,
				error: error
			} );
		} );
	}
}

export const activateModule = ( slug ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULE_ACTIVATE,
			module: slug
		} );
		return restApi.activateModule( slug ).then( () => {
			dispatch( {
				type: JETPACK_MODULE_ACTIVATE_SUCCESS,
				module: slug,
				success: true
			} );
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_ACTIVATE_FAIL,
				module: slug,
				success: false,
				error: error
			} );
		} );
	}
}

export const deactivateModule = ( slug ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULE_DEACTIVATE,
			module: slug
		} );
		return restApi.deactivateModule( slug ).then( () => {
			dispatch( {
				type: JETPACK_MODULE_DEACTIVATE_SUCCESS,
				module: slug,
				success: true
			} );
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_DEACTIVATE_FAIL,
				module: slug,
				success: false,
				error: error
			} );
		} );
	}
}

export const updateModuleOption = ( slug, updatedOption ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULE_UPDATE_OPTION,
			module: slug,
			updatedOption
		} );
		return restApi.updateModuleOption( slug, updatedOption ).then( success => {
			dispatch( {
				type: JETPACK_MODULE_UPDATE_OPTION_SUCCESS,
				module: slug,
				updatedOption,
				success: success
			} );
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_UPDATE_OPTION_FAIL,
				module: slug,
				success: false,
				error: error,
				updatedOption
			} );
		} );
	}
}
