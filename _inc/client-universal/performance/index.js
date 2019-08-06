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
		state => ( {} ),
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
