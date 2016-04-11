/**
 * External dependencies
 */
import fetch from 'isomorphic-fetch';

// window.WP_API_SETTINGS holds the rooot URL and a nonce for the REST API to authorizing the request

const restApi = {
	fetchSiteConnectionStatus: () => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/connection-status`, {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( response => response.json() ),
	disconnectSite: () => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/disconnect/site`, {
		method: 'post',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( response => response.json() ),
	fetchModules: () => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/modules`, {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( response => response.json() ),
	fetchModule: ( slug ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/module/${ slug }`, {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( response => response.json() ),
	activateModule: ( slug ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/module/${ slug }/activate`, {
		method: 'put',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} ),
	deactivateModule: ( slug ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/module/${ slug }/deactivate`, {
		method: 'put',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
};

export default restApi;
