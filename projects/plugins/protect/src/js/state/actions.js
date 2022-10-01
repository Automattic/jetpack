import apiFetch from '@wordpress/api-fetch';
import camelize from 'camelize';

const SET_STATUS = 'SET_STATUS';
const SET_STATUS_IS_FETCHING = 'SET_STATUS_IS_FETCHING';
const SET_INSTALLED_PLUGINS = 'SET_INSTALLED_PLUGINS';
const SET_INSTALLED_THEMES = 'SET_INSTALLED_THEMES';
const SET_WP_VERSION = 'SET_WP_VERSION';
const SET_JETPACK_SCAN = 'SET_JETPACK_SCAN';
const SET_PRODUCT_DATA = 'SET_PRODUCT_DATA';

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

const setJetpackScan = scan => {
	return { type: SET_JETPACK_SCAN, scan };
};

const setProductData = productData => {
	return { type: SET_PRODUCT_DATA, productData };
};

const actions = {
	setStatus,
	refreshStatus,
	setStatusIsFetching,
	setInstalledPlugins,
	setInstalledThemes,
	setwpVersion,
	setJetpackScan,
	setProductData,
};

export {
	SET_STATUS,
	SET_STATUS_IS_FETCHING,
	SET_INSTALLED_PLUGINS,
	SET_INSTALLED_THEMES,
	SET_WP_VERSION,
	SET_JETPACK_SCAN,
	actions as default,
};
