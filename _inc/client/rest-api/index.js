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
	let apiRoot = root,
		headers = {
			'X-WP-Nonce': nonce
		},
		getParams = {
			credentials: 'same-origin',
			headers: headers
		},
		postParams = {
			method: 'post',
			credentials: 'same-origin',
			headers: assign( {}, headers, {
				'Content-type': 'application/json'
			} )
		};

	const methods = {
		setApiRoot( newRoot ) {
			apiRoot = newRoot;
		},
		setApiNonce( newNonce ) {
			headers = {
				'X-WP-Nonce': newNonce
			};
			getParams = {
				credentials: 'same-origin',
				headers: headers
			};
			postParams = {
				method: 'post',
				credentials: 'same-origin',
				headers: assign( {}, headers, {
					'Content-type': 'application/json'
				} )
			};
		},

		fetchSiteConnectionStatus: () => fetch( `${ apiRoot }jetpack/v4/connection`, getParams )
			.then( response => response.json() ),

		fetchUserConnectionData: () => fetch( `${ apiRoot }jetpack/v4/connection/data`, getParams )
			.then( response => response.json() ),

		disconnectSite: () => fetch(
			`${ apiRoot }jetpack/v4/connection`,
			assign( {}, postParams, {
				body: JSON.stringify( { isActive: false } )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		fetchConnectUrl: () => fetch( `${ apiRoot }jetpack/v4/connection/url`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		unlinkUser: () => fetch(
			`${ apiRoot }jetpack/v4/connection/user`,
			assign( {}, postParams, {
				body: JSON.stringify( { linked: false } )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		jumpStart: ( action ) => {
			let active;
			if ( action === 'activate' ) {
				active = true;
			}
			if ( action === 'deactivate' ) {
				active = false;
			}
			return fetch(
				`${ apiRoot }jetpack/v4/jumpstart`,
				assign( {}, postParams, {
					body: JSON.stringify( { active } )
				} )
			)
				.then( checkStatus )
				.then( response => response.json() );
		},

		fetchModules: () => fetch( `${ apiRoot }jetpack/v4/module/all`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		fetchModule: ( slug ) => fetch( `${ apiRoot }jetpack/v4/module/${ slug }`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		activateModule: ( slug ) => fetch(
			`${ apiRoot }jetpack/v4/module/${ slug }/active`,
			assign( {}, postParams, {
				body: JSON.stringify( { active: true } )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		deactivateModule: ( slug ) => fetch(
			`${ apiRoot }jetpack/v4/module/${ slug }/active`,
			assign( {}, postParams, {
				body: JSON.stringify( { active: false } )
			} )
		),

		updateModuleOptions: ( slug, newOptionValues ) => fetch(
			`${ apiRoot }jetpack/v4/module/${ slug }`,
			assign( {}, postParams, {
				body: JSON.stringify( newOptionValues )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		updateSettings: ( newOptionValues ) => fetch(
			`${ apiRoot }jetpack/v4/settings`,
			assign( {}, postParams, {
				body: JSON.stringify( newOptionValues )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		getProtectCount: () => fetch( `${ apiRoot }jetpack/v4/module/protect/data`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		resetOptions: ( options ) => fetch(
			`${ apiRoot }jetpack/v4/options/${ options }`,
			assign( {}, postParams, {
				body: JSON.stringify( { reset: true } )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		getVaultPressData: () => fetch( `${ apiRoot }jetpack/v4/module/vaultpress/data`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		getAkismetData: () => fetch( `${ apiRoot }jetpack/v4/module/akismet/data`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		checkAkismetKey: () => fetch( `${ apiRoot }jetpack/v4/module/akismet/key/check`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		checkAkismetKeyTyped: apiKey => fetch(
			`${ apiRoot }jetpack/v4/module/akismet/key/check`,
			assign( {}, postParams, {
				body: JSON.stringify( { api_key: apiKey } )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		fetchStatsData: ( range ) => fetch( statsDataUrl( range ), getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		getPluginUpdates: () => fetch( `${ apiRoot }jetpack/v4/updates/plugins`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		fetchSettings: () => fetch( `${ apiRoot }jetpack/v4/settings`, getParams )
			.then( checkStatus )
			.then( response => response.json() ),

		updateSetting: ( updatedSetting ) => fetch(
			`${ apiRoot }jetpack/v4/settings`,
			assign( {}, postParams, {
				body: JSON.stringify( updatedSetting )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		fetchSiteData: () => fetch( `${ apiRoot }jetpack/v4/site`, getParams )
			.then( checkStatus )
			.then( response => response.json() )
			.then( body => JSON.parse( body.data ) ),

		dismissJetpackNotice: ( notice ) => fetch(
			`${ apiRoot }jetpack/v4/notice/${ notice }`,
			assign( {}, postParams, {
				body: JSON.stringify( { dismissed: true } )
			} )
		)
			.then( checkStatus )
			.then( response => response.json() ),

		fetchPluginsData: () => fetch( `${ apiRoot }jetpack/v4/plugins`, getParams )
			.then( checkStatus )
			.then( response => response.json() )
	};

	function statsDataUrl( range ) {
		let url = `${ apiRoot }jetpack/v4/module/stats/data`;
		if ( url.indexOf( '?' ) !== -1 ) {
			url = url + `&range=${ encodeURIComponent( range ) }`;
		} else {
			url = url + `?range=${ encodeURIComponent( range ) }`;
		}
		return url;
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
