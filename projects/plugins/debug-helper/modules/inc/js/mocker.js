import loaderButton from './loader.js';

class Mocker {
	constructor() {
		this.formElement = document.getElementById( 'jetpack-debug-mocker-form' );
		this.dataElement = this.formElement.querySelector( '#mocker-data' );
		this.numberElement = this.formElement.querySelector( '#mocker-number' );
		this.submitElement = this.formElement.querySelector( '#mocker-submit' );
		this.responseElement = this.formElement.querySelector( '#mocker-response' );

		this.limitPerBatch = 10000;
		this.limitBatches = 5;
		this.runningBatches = 0;

		if ( this.formElement ) {
			this.formElement.addEventListener( 'submit', e => {
				e.preventDefault();
				this.submit();
			} );
		}
	}

	async submit() {
		const loader = loaderButton( this.submitElement );
		loader.on();

		const data = this.dataElement.value.toLowerCase();
		const number = parseInt( this.numberElement.value );

		this.responseElement.innerHTML = '';
		this.responseElement.classList.remove( 'block-hide' );

		let k = 0;
		const batches = [];
		for ( let i = number; i > 0; i -= this.limitPerBatch ) {
			batches.push( this.runBatch( ++k, data, Math.min( i, this.limitPerBatch ) ) );
		}

		await Promise.all( batches );

		this.responseElement.innerHTML += `<br><br><strong>Finished! 🏁</strong>`;

		loader.off();
	}

	async runBatch( batchKey, data, number ) {
		const div = document.createElement( 'div' );
		this.responseElement.appendChild( div );

		if ( ! this.canBatch() ) {
			div.innerHTML = `Batch ${ batchKey } is waiting...`;
			await new Promise( resolve => {
				const interval = setInterval( () => {
					if ( this.canBatch() ) {
						clearInterval( interval );
						resolve();
					}
				}, 500 );
			} );
		}

		++this.runningBatches;
		div.innerHTML = `Batch ${ batchKey } has started...`;

		const url = `${ window.wpApiSettings.root }jetpack-debug/mocker${
			-1 === window.wpApiSettings.root.indexOf( '?' ) ? '?' : '&'
		}data=${ encodeURIComponent( data ) }&number=${ number }`;
		const headers = { 'X-WP-Nonce': window.wpApiSettings.nonce };

		const response = await fetch( url, { headers } );
		const body = await response.json();

		div.innerHTML = `Batch ${ batchKey } has finished: ${
			body.success ? 'success' : 'failure (see network log for details)'
		}`;

		return new Promise( resolve => {
			--this.runningBatches;
			resolve( true === body.success );
		} );
	}

	canBatch() {
		return this.runningBatches < this.limitBatches;
	}
}

document.addEventListener( 'DOMContentLoaded', () => new Mocker() );
