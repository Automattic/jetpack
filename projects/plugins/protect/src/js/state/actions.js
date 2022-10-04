import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';

const SET_STATUS = 'SET_STATUS';
const SET_STATUS_IS_FETCHING = 'SET_STATUS_IS_FETCHING';
const SET_INSTALLED_PLUGINS = 'SET_INSTALLED_PLUGINS';
const SET_INSTALLED_THEMES = 'SET_INSTALLED_THEMES';
const SET_WP_VERSION = 'SET_WP_VERSION';
const SET_SECURITY_BUNDLE = 'SET_SECURITY_BUNDLE';
const SET_PRODUCT_DATA = 'SET_PRODUCT_DATA';
const SET_THREAT_IS_UPDATING = 'SET_THREAT_IS_UPDATING';
const SET_MODAL = 'SET_MODAL';
const SET_NOTICE = 'SET_NOTICE';

const setStatus = status => {
	return { type: SET_STATUS, status };
};

/**
 * Side effect action which will fetch the status from the server
 *
 * @returns {Promise} - Promise which resolves when the status is refreshed from an API fetch.
 */
const refreshStatus = () => async ( { dispatch } ) => {
	dispatch( setStatusIsFetching( true ) );
	return await new Promise( ( resolve, reject ) => {
		return apiFetch( {
			path: 'jetpack-protect/v1/status',
			method: 'GET',
		} )
			.then( status => {
				dispatch( setStatus( camelize( status ) ) );
				dispatch( setStatusIsFetching( false ) );
				resolve( status );
			} )
			.catch( error => {
				reject( error );
			} );
	} );
};

const setStatusIsFetching = status => {
	return { type: SET_STATUS_IS_FETCHING, status };
};

const setInstalledPlugins = plugins => {
	return { type: SET_INSTALLED_PLUGINS, plugins };
};

const setInstalledThemes = themes => {
	return { type: SET_INSTALLED_THEMES, themes };
};

const setwpVersion = version => {
	return { type: SET_WP_VERSION, version };
};

const setSecurityBundle = bundle => {
	return { type: SET_SECURITY_BUNDLE, bundle };
};

const setProductData = productData => {
	return { type: SET_PRODUCT_DATA, productData };
};

const setThreatIsUpdating = ( threatId, isUpdating ) => {
	return { type: SET_THREAT_IS_UPDATING, payload: { threatId, isUpdating } };
};

const ignoreThreat = ( threatId, callback = () => {} ) => async ( { dispatch } ) => {
	dispatch( setThreatIsUpdating( threatId, true ) );
	return await new Promise( () => {
		return apiFetch( {
			path: `jetpack-protect/v1/ignore-threat?threat_id=${ threatId }`,
			method: 'POST',
		} )
			.then( () => {
				return dispatch( refreshStatus() );
			} )
			.then( () => {
				return dispatch(
					setNotice( { type: 'success', message: __( 'Threat ignored', 'jetpack-protect' ) } )
				);
			} )
			.catch( () => {
				return dispatch(
					setNotice( {
						type: 'error',
						message: __( 'An error ocurred ignoring the threat.', 'jetpack-protect' ),
					} )
				);
			} )
			.finally( () => {
				dispatch( setThreatIsUpdating( threatId, false ) );
				callback();
			} );
	} );
};

const setModal = modal => {
	return { type: SET_MODAL, payload: modal };
};

const setNotice = notice => {
	return { type: SET_NOTICE, payload: notice };
};

const actions = {
	setStatus,
	refreshStatus,
	setStatusIsFetching,
	setInstalledPlugins,
	setInstalledThemes,
	setwpVersion,
	setSecurityBundle,
	setProductData,
	ignoreThreat,
	setModal,
	setNotice,
};

export {
	SET_STATUS,
	SET_STATUS_IS_FETCHING,
	SET_INSTALLED_PLUGINS,
	SET_INSTALLED_THEMES,
	SET_WP_VERSION,
	SET_SECURITY_BUNDLE,
	SET_THREAT_IS_UPDATING,
	SET_MODAL,
	SET_NOTICE,
	actions as default,
};
