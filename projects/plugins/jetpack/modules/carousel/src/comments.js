/**
 * Internal dependencies
 */

import * as util from './util';

export function fetchComments( url, onSuccess, onError ) {
	if ( ! url ) {
		return;
	}

	onSuccess = onSuccess || util.noop;
	onError = onError || util.noop;

	const xhr = new XMLHttpRequest();

	xhr.open( 'GET', url );
	xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );

	xhr.onload = function () {
		const isSuccess = xhr.status >= 200 && xhr.status < 300;
		let response;

		try {
			response = JSON.parse( xhr.responseText );
		} catch ( e ) {
			onError();
			return;
		}

		if ( ! isSuccess || ! response || ! Array.isArray( response ) ) {
			return onError();
		}

		onSuccess( response );
	};

	xhr.onerror = onError;
	xhr.send();
}


export function postComment( url, data, onSuccess, onError ) {
	if ( ! url ) {
		return;
	}

	onSuccess = onSuccess || util.noop;
	onError = onError || util.noop;

	const xhr = new XMLHttpRequest();

	xhr.open( 'POST', url, true );
	xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
	xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );

	xhr.onreadystatechange = function () {
		if (
			this.readyState === XMLHttpRequest.DONE &&
			this.status >= 200 &&
			this.status < 300
		) {
			let response;
			try {
				response = JSON.parse( this.response );
			} catch ( error ) {
				onError();
				return;
			}

			onSuccess( response );

		} else {
			// TODO: Add error handling and display here
			onError();
		}
	};

	const params = [];

	for ( const prop in data ) {
		if ( data.hasOwnProperty( prop ) ) {
			if ( prop ) {
				// Encode each form element into a URI-compatible string.
				const encoded = encodeURIComponent( prop ) + '=' + encodeURIComponent( data[ prop ] );
				// In x-www-form-urlencoded, spaces should be `+`, not `%20`.
				params.push( encoded.replace( /%20/g, '+' ) );
			}
		}
	}

	const encodedData = params.join( '&' );

	xhr.send( encodedData );
}
