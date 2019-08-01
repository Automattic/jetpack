// this is intended to be run in a webworker
import Performance from 'performance';
import React from 'react';
import { render } from 'react-dom';
import { Provider, connect } from 'react-redux';
// import WPAPI from 'wpapi';
// import request from 'request';

console.log( 'running' );

// TODO - import domain? how to access?

var auth_type = document.querySelector( 'meta[name=authorization-type]' ).getAttribute( 'content' );
var auth_creds = document
	.querySelector( 'meta[name=authorization-credentials]' )
	.getAttribute( 'content' );
var url = document.querySelector( 'meta[name=api_url]' ).getAttribute( 'content' );

// var wp = new WPAPI( { endpoint: url } ).setHeaders( 'Authorization', auth_type + ' ' + auth_creds );

// wp.users().me().then( ( results ) => {
// 	console.warn( "user", results );
// });

fetch( url + '/wp/v2/users/me', {
	mode: 'cors',
	credentials: 'same-origin', //include, same-origin - required to circumvent CORB
	headers: {
		Authorization: auth_type + ' ' + auth_creds,
		Accept: 'application/json', // required to circumvent CORB
		'Content-Type': 'application/json', // required to circumvent CORB
	},
} ).then( function( response ) {
	console.warn( 'got response', response.json() );
} );

const div = document.createElement( 'div' );
document.body.appendChild( div );
// render(<Performance/>, div);
render( <h1>It works</h1>, div );

console.log( 'ran' );
