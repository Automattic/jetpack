/**
 * External dependencies
 */
require( 'es6-promise' ).polyfill();
import apiFetch from '@wordpress/api-fetch';
import assign from 'lodash/assign';

function JetpackRestApiClient() {
	const methods = {
		setApiRoot( newRoot ) {
			apiFetch.use( apiFetch.createRootURLMiddleware( newRoot ) );
		},
		setApiNonce( newNonce ) {
			apiFetch.use( apiFetch.createNonceMiddleware( newNonce ) );
		},
		fetchSiteConnectionStatus: () => getRequest( '/jetpack/v4/connection' ),

		fetchSiteConnectionStatus: () => getRequest( '/jetpack/v4/connection' )

		fetchSiteConnectionTest: () => getRequest( '/jetpack/v4/connection/test' )

		fetchUserConnectionData: () => getRequest( '/jetpack/v4/connection/data' ),

		fetchUserTrackingSettings: () => getRequest( '/jetpack/v4/tracking/settings' ),

		updateUserTrackingSettings: ( newSettings ) => postRequest(
			'/jetpack/v4/tracking/settings',
			newSettings
		),

		disconnectSite: () => postRequest( '/jetpack/v4/connection', { isActive: false } ),

		fetchConnectUrl: () => getRequest( '/jetpack/v4/connection/url' ),

		unlinkUser: () => postRequest( '/jetpack/v4/connection/user', { linked: false } ),

		jumpStart: ( action ) => {
			let active;
			if ( action === 'activate' ) {
				active = true;
			}
			if ( action === 'deactivate' ) {
				active = false;
			}
			return postRequest( '/jetpack/v4/jumpstart', { active } );
		},

		fetchModules: () => getRequest( '/jetpack/v4/module/all' ),

		fetchModule: ( slug ) => getRequest( `jetpack/v4/module/${ slug }` ),

		activateModule: ( slug ) => postRequest(
			`jetpack/v4/module/${ slug }/active`,
			{ active: true }
		),

		deactivateModule: ( slug ) => postRequest(
			`jetpack/v4/module/${ slug }/active`,
			{ active: false }
		),

		updateModuleOptions: ( slug, newOptionValues ) => postRequest(
			`jetpack/v4/module/${ slug }`,
			newOptionValues
		),

		updateSettings: ( newOptionValues ) => postRequest(
			'/jetpack/v4/settings',
			newOptionValues
		),

		getProtectCount: () => getRequest( '/jetpack/v4/module/protect/data' ),

		resetOptions: ( options ) => postRequest(
			`jetpack/v4/options/${ options }`,
			{ reset: true }
		),

		getVaultPressData: () => getRequest( '/jetpack/v4/module/vaultpress/data' ),

		getAkismetData: () => getRequest( '/jetpack/v4/module/akismet/data' ),

		checkAkismetKey: () => getRequest( '/jetpack/v4/module/akismet/key/check' ),

		checkAkismetKeyTyped: apiKey => postRequest(
			'/jetpack/v4/module/akismet/key/check',
			{ api_key: apiKey }
		),

		fetchStatsData: ( range ) => getRequest( statsDataUrl( range ) )
			.then( handleStatsResponseError ),

		getPluginUpdates: () => getRequest( '/jetpack/v4/updates/plugins' ),

		getPlans: () => getRequest( '/jetpack/v4/plans' ),

		fetchSettings: () => getRequest( '/jetpack/v4/settings' ),

		updateSetting: ( updatedSetting ) => postRequest( '/jetpack/v4/settings', updatedSetting ),

		fetchSiteData: () => getRequest( '/jetpack/v4/site' )
			.then( body => JSON.parse( body.data ) ),

		fetchSiteFeatures: () => getRequest( '/jetpack/v4/site/features' )
			.then( body => JSON.parse( body.data ) ),

		fetchRewindStatus: () => getRequest( '/jetpack/v4/rewind' )
			.then( body => JSON.parse( body.data ) ),

		dismissJetpackNotice: ( notice ) => postRequest( `/jetpack/v4/notice/${ notice }`, { dismissed: true } ),

		fetchPluginsData: () => getRequest( '/jetpack/v4/plugins' ),

		fetchVerifySiteGoogleStatus: ( keyringId ) => {
			const request = ( keyringId !== null )
				? getRequest( `/jetpack/v4/verify-site/google/${ keyringId }` )
				: getRequest( '/jetpack/v4/verify-site/google' );

			return request;
		},
		verifySiteGoogle: ( keyringId ) => postRequest( '/jetpack/v4/verify-site/google', {
			body: JSON.stringify( { keyring_id: keyringId } ),
		} )
	};

	function getRequest( path ) {
		return apiFetch( {
			path
		} );
	}

	function postRequest( path, data ) {
		return apiFetch( {
			path,
			method: 'POST',
			data,
		} );
	}

	function statsDataUrl( range ) {
		let url = '/jetpack/v4/module/stats/data';
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
