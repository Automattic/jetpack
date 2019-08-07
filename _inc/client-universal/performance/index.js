// this is intended to be run in a webworker

/**
 * External Dependencies
 */
import React from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';

/**
 * Internal Dependencies
 */
// import store from ;
import restApi from 'rest-api';

// fake initial state
// window.Initial_State = {
// 	connectionStatus: false,
// 	userData: {}
// };

console.log( 'before load configuration' );

var authType = document.querySelector( 'meta[name=authorization-type]' ).getAttribute( 'content' );
var authCreds = document
	.querySelector( 'meta[name=authorization-credentials]' )
	.getAttribute( 'content' );
var apiUrl = document.querySelector( 'meta[name=api_url]' ).getAttribute( 'content' );

// use this information to fetch window.Initial_State

fetchInitialState()
	.then( initialState => {
		// do something
		console.warn( 'got initial state', initialState );
		// if ( typeof( globalThis.window ) === 'undefined' ) {
		// 	globalThis.window = {};
		// };
		globalThis.Initial_State = initialState; // TODO find IE hacks for this
		loadApp();
	} )
	.catch( error => {
		console.error( 'failed to fetch initial state', error );
	} );

function loadApp() {
	// console.warn("about to load store", globalThis.window);
	const Performance = require( 'performance' ).default;
	const store = require( 'state/redux-store' ).default;
	const setInitialState = require( 'state/initial-state' ).setInitialState;
	const { getApiNonce, getApiRootUrl } = require( 'state/initial-state' );

	// import WPAPI from 'wpapi';
	// import request from 'request';

	console.log( 'loading' );
	// TODO - import domain? how to access?

	// var wp = new WPAPI( { endpoint: url } ).setHeaders( 'Authorization', authType + ' ' + authCreds );

	// wp.users().me().then( ( results ) => {
	// 	console.warn( "user", results );
	// });

	class App extends React.Component {
		UNSAFE_componentWillMount() {
			this.props.setInitialState();
			restApi.setApiRoot( this.props.apiRoot );
			// restApi.setApiNonce( this.props.apiNonce );
			restApi.setApiHeader( 'Authorization', authType + ' ' + authCreds );
			restApi.setApiHeader( 'Accept', 'application/json' );
			restApi.setApiHeader( 'Content-Type', 'application/json' );
			restApi.setApiGetParams( { mode: 'cors' } );
			restApi.setApiPostParams( { mode: 'cors' } );
			// : 'application/json', // required to circumvent CORB
			// 'Content-Type': 'application/json', // required to circumvent CORB
		}
		render() {
			return (
				<React.Fragment>
					<h1>Page header</h1>
					<p>V 1</p>
					<Performance active={ true } />
					<h1>Page footer</h1>
				</React.Fragment>
			);
		}
	}

	const ConnectedApp = connect(
		state => {
			return {
				// siteConnectionStatus: getSiteConnectionStatus( state ),
				// isLinked: isCurrentUserLinked( state ),
				// siteRawUrl: getSiteRawUrl( state ),
				// siteAdminUrl: getSiteAdminUrl( state ),
				// searchTerm: getSearchTerm( state ),
				apiRoot: getApiRootUrl( state ),
				apiNonce: getApiNonce( state ),
				// tracksUserData: getTracksUserData( state ),
				// areThereUnsavedSettings: areThereUnsavedSettings( state ),
				// userCanManageModules: userCanManageModules( state ),
				// userCanConnectSite: userCanConnectSite( state ),
				// isSiteConnected: isSiteConnected( state ),
				// rewindStatus: getRewindStatus( state ),
				// currentVersion: getCurrentVersion( state ),
			};
		},
		dispatch => ( {
			setInitialState: () => {
				return dispatch( setInitialState() );
			},
		} )
	)( App );

	const div = document.createElement( 'div' );
	document.body.appendChild( div );
	// render(<Performance/>, div);
	render(
		<Provider store={ store }>
			<ConnectedApp />
		</Provider>,
		div
	);

	console.log( 'ran' );
}

function fetchInitialState() {
	return fetchApi( '/jetpack/v4/universal-clients/initial-state' );
}

// example
function fetchMe() {
	return fetchApi( '/wp/v2/users/me' );
}

function fetchApi( path ) {
	return fetch( apiUrl + path, {
		mode: 'cors',
		credentials: 'same-origin', //include, same-origin - required to circumvent CORB
		headers: {
			Authorization: authType + ' ' + authCreds,
			Accept: 'application/json', // required to circumvent CORB
			'Content-Type': 'application/json', // required to circumvent CORB
		},
	} ).then( response => {
		return response.json();
	} );
}
