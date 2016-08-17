/**
 * External dependencies
 */
require( 'es6-promise' ).polyfill();
import 'whatwg-fetch';
import assign from 'lodash/assign';

/**
 * External dependencies
 */

function JetpackRestApiClient( root, nonce ) {
	let apiRoot = root;
	let apiNonce = nonce;

	const methods = {
		setApiRoot( newRoot ) {
			apiRoot = newRoot;
		},
		setApiNonce( newNonce ) {
			apiNonce = newNonce;
		},
		fetchSiteConnectionStatus: () => fetch( `${ apiRoot }jetpack/v4/connection-status`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( response => response.json() ),
		fetchUserConnectionData: () => fetch( `${ apiRoot }jetpack/v4/user-connection-data`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( response => response.json() ),
		disconnectSite: () => fetch( `${ apiRoot }jetpack/v4/disconnect/site`, {
			method: 'post',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		fetchConnectUrl: () => fetch( `${ apiRoot }jetpack/v4/connect-url`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		jumpStart: ( action ) => fetch( `${ apiRoot }jetpack/v4/jumpstart/${ action }`, {
			method: 'post',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		fetchModules: () => fetch( `${ apiRoot }jetpack/v4/modules`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		fetchModule: ( slug ) => fetch( `${ apiRoot }jetpack/v4/module/${ slug }`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		activateModule: ( slug ) => fetch( `${ apiRoot }jetpack/v4/module/${ slug }/activate`, {
			method: 'put',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		deactivateModule: ( slug ) => fetch( `${ apiRoot }jetpack/v4/module/${ slug }/deactivate`, {
			method: 'put',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} ),
		updateModuleOptions: ( slug, newOptionValues ) => fetch( `${ apiRoot }jetpack/v4/module/${ slug }/update`, {
			method: 'put',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			},
			body: JSON.stringify( newOptionValues )
		} )
		.then( checkStatus ).then( response => response.json() ),
		getProtectCount: () => fetch( `${ apiRoot }jetpack/v4/module/protect/count/get`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		resetOptions: ( options ) => fetch( `${ apiRoot }jetpack/v4/reset/${ options }`, {
			method: 'post',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		getVaultPressData: () => fetch( `${ apiRoot }jetpack/v4/module/vaultpress/data`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		getLastDownTime: () => fetch( `${ apiRoot }jetpack/v4/module/monitor/downtime/last`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		getAkismetData: () => fetch( `${ apiRoot }jetpack/v4/akismet/stats/get`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		fetchStatsData: ( range ) => fetch( `${ apiRoot }jetpack/v4/module/stats/get`, {
			method: 'put',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			},
			body: JSON.stringify( {
				range: range
			} )
		} )
		.then( checkStatus ).then( response => response.json() ),
		getPluginUpdates: () => fetch( `${ apiRoot }jetpack/v4/updates/plugins`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		fetchSettings: () => fetch( `${ apiRoot }jetpack/v4/settings`, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		updateSetting: ( updatedSetting ) => fetch( `${ apiRoot }jetpack/v4/setting/update`, {
			method: 'put',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			},
			body: JSON.stringify( updatedSetting )
		} )
		.then( checkStatus ).then( response => response.json() ),
		unlinkUser: () => fetch( `${ apiRoot }jetpack/v4/unlink`, {
			method: 'put',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		fetchSiteData: () => {
			if ( Promise.resolve( window.Initial_State.siteData ) === window.Initial_State.siteData ) {
				return window.Initial_State.siteData;
			}
			return fetch( `${ apiRoot }jetpack/v4/site`, {
				method: 'get',
				credentials: 'same-origin',
				headers: {
					'X-WP-Nonce': apiNonce,
					'Content-type': 'application/json'
				}
			} )
			.then( checkStatus ).then( response => {
				window.Initial_State.siteData = response.json();
				return window.Initial_State.siteData;
			} );
		},
		dismissJetpackNotice: ( notice ) => fetch( `${ apiRoot }jetpack/v4/notice/${ notice }/dismiss`, {
			method: 'put',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() ),
		fetchPluginsData: () => fetch( `${ apiRoot }jetpack/v4/plugins`, {
			method: 'get',
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
				'Content-type': 'application/json'
			}
		} )
		.then( checkStatus ).then( response => response.json() )
	}

	assign( this, methods );
}

const restApi = new JetpackRestApiClient();

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
