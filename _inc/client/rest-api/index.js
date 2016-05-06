/**
 * External dependencies
 */
require('es6-promise').polyfill();
import fetch from 'isomorphic-fetch';

/**
 * Internal dependencies
 */
import { getApiRoot, getApiNonce } from 'state/initial-state';

//const root = getApiRoot( this.props );
//const nonce = getApiNonce( this.props );

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
		.then( checkStatus ).then( response => response.json() ),
	jumpStart: ( action ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/jumpstart/${ action }`, {
		method: 'post',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( checkStatus ).then( response => response.json() ),
	fetchModules: () => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/modules`, {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( checkStatus ).then( response => response.json() ),
	fetchModule: ( slug ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/module/${ slug }`, {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( checkStatus ).then( response => response.json() ),
	activateModule: ( slug ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/module/${ slug }/activate`, {
		method: 'put',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} )
		.then( checkStatus ).then( response => response.json() ),
	deactivateModule: ( slug ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/module/${ slug }/deactivate`, {
		method: 'put',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce
		}
	} ),
	updateModuleOption: ( slug, updatedOption ) => fetch( `${ window.Initial_State.WP_API_root }jetpack/v4/module/${ slug }/update`, {
		method: 'put',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.Initial_State.WP_API_nonce,
			'Content-type': 'application/json'
		},
		body: JSON.stringify( updatedOption )
	} )
		.then( checkStatus ).then( response => response.json() )
};

export default restApi;

function checkStatus( response ) {
	if ( response.status >= 200 && response.status < 300 ) {
		return response;
	}
	return response.json().then( json => {
		const error = new Error( json.message );
		error.response = json;
		throw error;
	} );
}
