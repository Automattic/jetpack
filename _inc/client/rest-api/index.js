/**
 * External dependencies
 */
import fetch from 'isomorphic-fetch';

// window.WP_API_SETTINGS holds the rooot URL and a nonce for the REST API to authorizing the request

const restApi = {
	fetchModules: () => fetch( `${ window.WP_API_Settings.root }jetpack/v4/modules`, {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.WP_API_Settings.nonce
		}
	} )
		.then( response => response.json() ),
	fetchModule: ( slug ) => fetch( `${ window.WP_API_Settings.root }jetpack/v4/module/${ slug }`, {
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.WP_API_Settings.nonce
		}
	} )
		.then( response => response.json() ),
	activateModule: ( slug ) => fetch( `${ window.WP_API_Settings.root }jetpack/v4/module/${ slug }/activate`, {
		method: 'put',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.WP_API_Settings.nonce
		}
	} ),
	deactivateModule: ( slug ) => fetch( `${ window.WP_API_Settings.root }jetpack/v4/module/${ slug }/deactivate`, {
		method: 'put',
		credentials: 'same-origin',
		headers: {
			'X-WP-Nonce': window.WP_API_Settings.nonce
		}
	} )
};

export default restApi;
