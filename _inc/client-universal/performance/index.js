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
import restApi from 'rest-api';

// render an error to the console and the DOM
function showError( message ) {
	console.error( message );
	const div = document.createElement( 'div' );
	document.body.appendChild( div );
	render( <p style={ { color: 'red' } }>Error: { message }</p>, div );
}

if ( ! document.querySelector( 'meta[name=authorization-type]' ) ) {
	showError( 'meta[name="authorization-type"] is required' );
	process.exit();
}

if ( ! document.querySelector( 'meta[name=authorization-credentials]' ) ) {
	showError( 'meta[name="authorization-credentials"] is required' );
	process.exit();
}

if ( ! document.querySelector( 'meta[name=wp-api-url]' ) ) {
	showError( 'meta[name="wp-api-url"] is required' );
	process.exit();
}

var authType = document.querySelector( 'meta[name=authorization-type]' ).getAttribute( 'content' );
var authCreds = document
	.querySelector( 'meta[name=authorization-credentials]' )
	.getAttribute( 'content' );
var apiUrl = document.querySelector( 'meta[name=wp-api-url]' ).getAttribute( 'content' );

fetchInitialState()
	.then( initialState => {
		globalThis.Initial_State = initialState; // TODO find IE hacks for this - not supported in IE<Edge
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

	class App extends React.Component {
		UNSAFE_componentWillMount() {
			this.props.setInitialState();
			restApi.setApiRoot( this.props.apiRoot );
			restApi.setApiHeader( 'Authorization', authType + ' ' + authCreds );
			restApi.setApiGetParams( { mode: 'cors' } );
			restApi.setApiPostParams( { mode: 'cors' } );
		}
		render() {
			return (
				<React.Fragment>
					<Performance active={ true } />
				</React.Fragment>
			);
		}
	}

	const ConnectedApp = connect(
		state => {
			return {
				apiRoot: getApiRootUrl( state ),
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
		// credentials: 'same-origin', //include, same-origin - required to circumvent CORB
		headers: {
			Authorization: authType + ' ' + authCreds,
			Accept: 'application/json', // required to circumvent CORB
			'Content-Type': 'application/json', // required to circumvent CORB
		},
	} ).then( response => {
		return response.json();
	} );
}
