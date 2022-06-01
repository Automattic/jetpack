import loaderButton from './loader.js';

class Jetpack_Debug_REST_API_Tester {
	interval = null;

	constructor() {
		this.formElement = document.getElementById( 'jetpack-debug-api-tester-form' );
		this.methodElement = this.formElement.querySelector( '#api-tester-method' );
		this.urlElement = this.formElement.querySelector( '#api-tester-url' );
		this.bodyElement = this.formElement.querySelector( '#api-tester-body' );
		this.contentTypeElement = this.formElement.querySelector( '#api-tester-content-type' );
		this.submitElement = this.formElement.querySelector( '#api-tester-submit' );
		this.responseElement = this.formElement.querySelector( '#api-tester-response' );

		if ( this.formElement ) {
			this.formElement.addEventListener( 'submit', e => {
				e.preventDefault();
				this.submit();
			} );
		}

		if ( this.methodElement ) {
			this.methodElement.addEventListener( 'change', () => {
				this.methodSwitched( this.methodElement.value );
			} );

			this.methodSwitched( this.methodElement.value );
		}
	}

	methodSwitched( method ) {
		let callback = null;

		switch ( method.toUpperCase() ) {
			case 'GET':
			case 'DELETE':
				callback = el => el.classList.add( 'block-hide' );
				break;
			case 'POST':
			case 'PUT':
				callback = el => el.classList.remove( 'block-hide' );
				break;
		}

		if ( callback ) {
			[ ...this.formElement.getElementsByClassName( 'api-tester-filter-post' ) ].forEach(
				callback
			);
		}
	}

	submit() {
		const loader = loaderButton( this.submitElement );
		const method = this.methodElement.value.toUpperCase();
		let body = null;

		const request = new XMLHttpRequest();
		request.open( method, `${ window.wpApiSettings.root }jetpack/v4/${ this.urlElement.value }` );

		request.setRequestHeader( 'X-WP-Nonce', window.wpApiSettings.nonce );

		switch ( method ) {
			case 'POST':
			case 'PUT':
				request.setRequestHeader( 'Content-Type', this.contentTypeElement.value );
				body = this.bodyElement.value;
		}

		request.onreadystatechange = () => {
			if ( request.readyState === XMLHttpRequest.DONE ) {
				loader.off();
				this.handleResponse( request );
			}
		};

		request.send( body );

		loader.on();

		this.responseElement.innerHTML = '';
		this.responseElement.classList.add( 'block-hide' );
	}

	handleResponse( request ) {
		let responseText = request.responseText;

		if ( request.getResponseHeader( 'content-type' ).indexOf( 'application/json' ) === 0 ) {
			try {
				const parsedResponse = JSON.parse( responseText );
				responseText = JSON.stringify( parsedResponse, null, 4 );
			} catch ( e ) {
				responseText = 'Invalid JSON:\n' + responseText;
			}
		}

		this.responseElement.innerHTML = `<h2>Response:</h2>
<pre>${ this.escapeHtml( request.status ) } ${ this.escapeHtml( request.statusText ) }

${ this.escapeHtml( request.getAllResponseHeaders() ) }

${ this.escapeHtml( responseText ) }</pre>`;

		this.responseElement.classList.remove( 'block-hide' );
	}

	escapeHtml( html ) {
		return html
			.toLocaleString()
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' )
			.replace( /'/g, '&#039;' );
	}
}

document.addEventListener( 'DOMContentLoaded', () => new Jetpack_Debug_REST_API_Tester() );
