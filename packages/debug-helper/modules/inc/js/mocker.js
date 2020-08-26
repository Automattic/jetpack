/**
 * Internal dependencies
 */
import loaderButton from './loader.js';

class Mocker {
	constructor() {
		this.formElement = document.getElementById( 'jetpack-debug-mocker-form' );
		this.dataElement = this.formElement.querySelector( '#mocker-data' );
		this.numberElement = this.formElement.querySelector( '#mocker-number' );
		this.submitElement = this.formElement.querySelector( '#mocker-submit' );
		this.responseElement = this.formElement.querySelector( '#mocker-response' );

		if ( this.formElement ) {
			this.formElement.addEventListener( 'submit', e => {
				e.preventDefault();
				this.submit();
			} );
		}
	}

	submit() {
		const loader = loaderButton( this.submitElement );
		loader.on();

		const data = this.dataElement.value.toLowerCase();
		const number = parseInt( this.numberElement.value );

		fetch(
			`${ window.wpApiSettings.root }jetpack-debug/mocker&data=${ encodeURIComponent(
				data
			) }&number=${ number }`,
			{
				headers: {
					'X-WP-Nonce': window.wpApiSettings.nonce,
				},
			}
		)
			.then( response => response.json() )
			.then( body => {
				if ( ! body.success ) {
					console.log( body );
				}

				loader.off();

				this.responseElement.innerHTML = `<strong>Response: ${
					body.success ? 'Success' : 'Failure (see console log for details)'
				}</strong>`;

				this.responseElement.classList.remove( 'block-hide' );
			} );

		this.responseElement.innerHTML = '';
		this.responseElement.classList.add( 'block-hide' );
	}
}

document.addEventListener( 'DOMContentLoaded', () => new Mocker() );
