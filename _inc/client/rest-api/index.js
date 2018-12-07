/**
 * External dependencies
 */
require( 'es6-promise' ).polyfill();
import 'whatwg-fetch';
import assign from 'lodash/assign';
import head from 'lodash/head';

/**
 * Helps create new custom error classes to better notify upper layers.
 * @param {String} name the Error name that will be availble in Error.name
 * @return {Error}      a new custom error class.
 */
function createCustomError( name ) {
	class CustomError extends Error {
		constructor( ...args ) {
			super( ...args );
			this.name = name;
		}
	}
	return CustomError;
}

export const JsonParseError = createCustomError( 'JsonParseError' );
export const JsonParseAfterRedirectError = createCustomError( 'JsonParseAfterRedirectError' );
export const Api404Error = createCustomError( 'Api404Error' );
export const Api404AfterRedirectError = createCustomError( 'Api404AfterRedirectError' );
export const FetchNetworkError = createCustomError( 'FetchNetworkError' );

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

		fetchSiteConnectionStatus: () => getRequest( `${ apiRoot }jetpack/v4/connection`, getParams )
			.then( parseJsonResponse ),

		fetchSiteConnectionTest: () => getRequest( `${ apiRoot }jetpack/v4/connection/test`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchUserConnectionData: () => getRequest( `${ apiRoot }jetpack/v4/connection/data`, getParams )
			.then( parseJsonResponse ),

		fetchUserTrackingSettings: () => getRequest( `${ apiRoot }jetpack/v4/tracking/settings`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		updateUserTrackingSettings: ( newSettings ) => postRequest(
			`${ apiRoot }jetpack/v4/tracking/settings`,
			postParams,
			{
				body: JSON.stringify( newSettings )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse ),

		disconnectSite: () => postRequest( `${ apiRoot }jetpack/v4/connection`, postParams, {
			body: JSON.stringify( { isActive: false } )
		} )
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchConnectUrl: () => getRequest( `${ apiRoot }jetpack/v4/connection/url`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		unlinkUser: () => postRequest( `${ apiRoot }jetpack/v4/connection/user`, postParams, {
			body: JSON.stringify( { linked: false } )
		} )
			.then( checkStatus )
			.then( parseJsonResponse ),

		jumpStart: ( action ) => {
			let active;
			if ( action === 'activate' ) {
				active = true;
			}
			if ( action === 'deactivate' ) {
				active = false;
			}
			return postRequest( `${ apiRoot }jetpack/v4/jumpstart`, postParams, {
				body: JSON.stringify( { active } )
			} )
				.then( checkStatus )
				.then( parseJsonResponse );
		},

		fetchModules: () => getRequest( `${ apiRoot }jetpack/v4/module/all`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchModule: ( slug ) => getRequest( `${ apiRoot }jetpack/v4/module/${ slug }`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		activateModule: ( slug ) => postRequest(
			`${ apiRoot }jetpack/v4/module/${ slug }/active`,
			postParams,
			{
				body: JSON.stringify( { active: true } )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse ),

		deactivateModule: ( slug ) => postRequest(
			`${ apiRoot }jetpack/v4/module/${ slug }/active`,
			postParams,
			{
				body: JSON.stringify( { active: false } )
			}
		),

		updateModuleOptions: ( slug, newOptionValues ) => postRequest(
			`${ apiRoot }jetpack/v4/module/${ slug }`,
			postParams,
			{
				body: JSON.stringify( newOptionValues )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse ),

		updateSettings: ( newOptionValues ) => postRequest(
			`${ apiRoot }jetpack/v4/settings`,
			postParams,
			{
				body: JSON.stringify( newOptionValues )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse ),

		getProtectCount: () => getRequest( `${ apiRoot }jetpack/v4/module/protect/data`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		resetOptions: ( options ) => postRequest(
			`${ apiRoot }jetpack/v4/options/${ options }`,
			postParams,
			{
				body: JSON.stringify( { reset: true } )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse ),

		getVaultPressData: () => getRequest( `${ apiRoot }jetpack/v4/module/vaultpress/data`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		getAkismetData: () => getRequest( `${ apiRoot }jetpack/v4/module/akismet/data`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		checkAkismetKey: () => getRequest( `${ apiRoot }jetpack/v4/module/akismet/key/check`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		checkAkismetKeyTyped: apiKey => postRequest(
			`${ apiRoot }jetpack/v4/module/akismet/key/check`,
			postParams,
			{
				body: JSON.stringify( { api_key: apiKey } )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchStatsData: ( range ) => getRequest( statsDataUrl( range ), getParams )
			.then( checkStatus )
			.then( parseJsonResponse )
			.then( handleStatsResponseError ),

		getPluginUpdates: () => getRequest( `${ apiRoot }jetpack/v4/updates/plugins`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		getPlans: () => getRequest( `${ apiRoot }jetpack/v4/plans`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchSettings: () => getRequest( `${ apiRoot }jetpack/v4/settings`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		updateSetting: ( updatedSetting ) => postRequest( `${ apiRoot }jetpack/v4/settings`, postParams, {
			body: JSON.stringify( updatedSetting )
		} )
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchSiteData: () => getRequest( `${ apiRoot }jetpack/v4/site`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse )
			.then( body => JSON.parse( body.data ) ),

		fetchSiteFeatures: () => getRequest( `${ apiRoot }jetpack/v4/site/features`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse )
			.then( body => JSON.parse( body.data ) ),

		fetchRewindStatus: () => getRequest( `${ apiRoot }jetpack/v4/rewind`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse )
			.then( body => JSON.parse( body.data ) ),

		dismissJetpackNotice: ( notice ) => postRequest(
			`${ apiRoot }jetpack/v4/notice/${ notice }`,
			postParams,
			{
				body: JSON.stringify( { dismissed: true } )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchPluginsData: () => getRequest( `${ apiRoot }jetpack/v4/plugins`, getParams )
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchVerifySiteGoogleStatus: ( keyringId ) => {
			const request = ( keyringId !== null )
				? getRequest( `${ apiRoot }jetpack/v4/verify-site/google/${ keyringId }`, getParams )
				: getRequest( `${ apiRoot }jetpack/v4/verify-site/google`, getParams );

			return request
				.then( checkStatus )
				.then( parseJsonResponse );
		},

		verifySiteGoogle: ( keyringId ) => postRequest( `${ apiRoot }jetpack/v4/verify-site/google`, postParams, {
			body: JSON.stringify( { keyring_id: keyringId } ),
		} )
			.then( checkStatus )
			.then( parseJsonResponse ),

		fetchJitm: ( message_path, query_url ) => {
			const requestUrl = `${ apiRoot }jetpack/v4/jitm?message_path=${ encodeURIComponent( message_path ) }&query=${ encodeURIComponent( query_url ) }`;

			return getRequest( requestUrl, getParams )
				.then( checkStatus )
				.then( parseJsonResponse )
				.then( messages => ( head( messages ) ) );
		},

		dismissJitm: ( id, feature_class ) => postRequest(
			`${ apiRoot }jetpack/v4/jitm`,
			postParams,
			{
				body: JSON.stringify( { id, feature_class } )
			}
		)
			.then( checkStatus )
			.then( parseJsonResponse )
	};

	function addCacheBuster( route ) {
		const parts = route.split( '?' ),
			query = parts.length > 1
				? parts[ 1 ]
				: '',
			args = query.length
				? query.split( '&' )
				: [];

		args.push( '_cacheBuster=' + new Date().getTime() );

		return parts[ 0 ] + '?' + args.join( '&' );
	}

	function getRequest( route, params ) {
		return fetch( addCacheBuster( route ), params );
	}

	function postRequest( route, params, body ) {
		return fetch( route, assign( {}, params, body ) ).catch( catchNetworkErrors );
	}

	function statsDataUrl( range ) {
		let url = `${ apiRoot }jetpack/v4/module/stats/data`;
		if ( url.indexOf( '?' ) !== -1 ) {
			url = url + `&range=${ encodeURIComponent( range ) }`;
		} else {
			url = url + `?range=${ encodeURIComponent( range ) }`;
		}
		return url;
	}

	function handleStatsResponseError( statsData ) {
		// If we get a .response property, it means that .com's response is errory.
		// Probably because the site does not have stats yet.
		const responseOk =
			( statsData.general && statsData.general.response === undefined ) ||
			( statsData.week && statsData.week.response === undefined ) ||
			( statsData.month && statsData.month.response === undefined );
		return responseOk ? statsData : {};
	}

	assign( this, methods );
}

const restApi = new JetpackRestApiClient();

export default restApi;

function checkStatus( response ) {
	// Regular success responses
	if ( response.status >= 200 && response.status < 300 ) {
		return response;
	}

	if ( response.status === 404 ) {
		return new Promise( () => {
			const err = response.redirected
				? new Api404AfterRedirectError( response.redirected )
				: new Api404Error();
			throw err;
		} );
	}

	return response.json().then( json => {
		const error = new Error( `${ json.message } (Status ${ response.status })` );
		error.response = json;
		throw error;
	} );
}

function parseJsonResponse( response ) {
	return response.json().catch( e => catchJsonParseError( e, response.redirected, response.url ) );
}

function catchJsonParseError( e, redirected, url ) {
	const err = redirected
		? new JsonParseAfterRedirectError( url )
		: new JsonParseError();
	throw err;
}

// Catches TypeError coming from the Fetch API implementation
function catchNetworkErrors() {
	//Either one of:
	// * A preflight error like a redirection to an external site (which results in a CORS)
	// * A preflight error like ERR_TOO_MANY_REDIRECTS
	throw new FetchNetworkError();
}
