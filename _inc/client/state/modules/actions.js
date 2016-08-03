/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';

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
	JETPACK_MODULE_UPDATE_OPTIONS,
	JETPACK_MODULE_UPDATE_OPTIONS_FAIL,
	JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS
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
		dispatch( removeNotice( `module-${ slug }` ) );
		dispatch( createNotice( 'is-info', `Activating ${ slug }...`, { id: `module-${ slug }` } ) );
		return restApi.activateModule( slug ).then( () => {
			dispatch( {
				type: JETPACK_MODULE_ACTIVATE_SUCCESS,
				module: slug,
				success: true
			} );
			dispatch( removeNotice( `module-${ slug }` ) );
			dispatch( createNotice( 'is-success', `${ slug } has been activated`, { id: `module-${ slug }` } ) );
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_ACTIVATE_FAIL,
				module: slug,
				success: false,
				error: error
			} );
			dispatch( removeNotice( `module-${ slug }` ) );
			dispatch( createNotice( 'is-error', `${ slug } failed to activate`, { id: `module-${ slug }` } ) );
		} );
	}
}

export const deactivateModule = ( slug ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULE_DEACTIVATE,
			module: slug
		} );
		dispatch( removeNotice( `module-${ slug }` ) );
		dispatch( createNotice( 'is-info', `Deactivating ${ slug }...`, { id: `module-${ slug }` } ) );
		return restApi.deactivateModule( slug ).then( () => {
			dispatch( {
				type: JETPACK_MODULE_DEACTIVATE_SUCCESS,
				module: slug,
				success: true
			} );
			dispatch( removeNotice( `module-${ slug }` ) );
			dispatch( createNotice( 'is-success', `${ slug } has been deactivated`, { id: `module-${ slug }` } ) );
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_DEACTIVATE_FAIL,
				module: slug,
				success: false,
				error: error
			} );
			dispatch( removeNotice( `module-${ slug }` ) );
			dispatch( createNotice( 'is-error', `${ slug } failed to deactivate`, { id: `module-${ slug }` } ) );
		} );
	}
}

export const updateModuleOptions = ( slug, newOptionValues ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULE_UPDATE_OPTIONS,
			module: slug,
			newOptionValues
		} );
		return restApi.updateModuleOptions( slug, newOptionValues ).then( success => {
			dispatch( {
				type: JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS,
				module: slug,
				newOptionValues,
				success: success
			} );
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_UPDATE_OPTIONS_FAIL,
				module: slug,
				success: false,
				error: error,
				newOptionValues
			} );
		} );
	}
}

export const regeneratePostByEmailAddress = () => {
	const slug = 'post-by-email';
	const payload = {
		post_by_email_address: 'regenerate'
	};
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_MODULE_UPDATE_OPTIONS,
			module: slug,
			newOptionValues: payload
		} );
		return restApi.updateModuleOptions( slug, payload ).then( success => {
			const newOptionValues = {
				post_by_email_address: success.post_by_email_address
			};
			dispatch( {
				type: JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS,
				module: slug,
				newOptionValues,
				success: success
			} );
		} )['catch']( error => {
			dispatch( {
				type: JETPACK_MODULE_UPDATE_OPTIONS_FAIL,
				module: slug,
				success: false,
				error: error,
				newOptionValues: payload
			} );
		} );
	}
}
