import loaderButton from './loader.js';

class CookieState {
	constructor() {
		this.formElement = document.getElementById( 'jetpack-debug-cookie-state-form' );
		this.keyElement = this.formElement.querySelector( '#cookie-state-key' );
		this.valueElement = this.formElement.querySelector( '#cookie-state-value' );
		this.submitElement = this.formElement.querySelector( '#cookie-state-submit' );
		this.unsetElement = this.formElement.querySelector( '#cookie-state-unset' );
		this.responseElement = this.formElement.querySelector( '#cookie-state-response' );

		if ( this.formElement ) {
			this.formElement.addEventListener( 'submit', e => {
				e.preventDefault();
				this.submit();
			} );
		}

		if ( this.submitElement ) {
			this.submitElement.addEventListener( 'click', e => {
				e.preventDefault();
				this.submit();
			} );
		}

		if ( this.unsetElement ) {
			this.unsetElement.addEventListener( 'click', e => {
				e.preventDefault();
				this.unset();
			} );
		}
	}

	async submit() {
		const loader = loaderButton( this.submitElement );
		loader.on();

		const key = this.keyElement.value;
		const value = this.valueElement.value;

		this.responseElement.innerHTML = '';
		this.responseElement.classList.remove( 'block-hide' );

		const url = `${ window.wpApiSettings.root }jetpack-debug/cookie-state${
			-1 === window.wpApiSettings.root.indexOf( '?' ) ? '?' : '&'
		}key=${ encodeURIComponent( key ) }&value=${ encodeURIComponent( value ) }`;
		const headers = { 'X-WP-Nonce': window.wpApiSettings.nonce };

		const response = await fetch( url, { headers, method: 'POST' } );
		const body = await response.json();

		if ( body.success === true ) {
			this.responseElement.innerHTML = 'Saved!';
			location.reload();
		} else {
			this.responseElement.innerHTML = 'Error (see network log)';
			loader.off();
		}
	}
}

document.addEventListener( 'DOMContentLoaded', () => new CookieState() );
