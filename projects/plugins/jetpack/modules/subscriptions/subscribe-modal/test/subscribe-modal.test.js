import { readFileSync } from 'fs';
import path from 'path';

describe( 'Subscribe modal', () => {
	let style;

	beforeEach( () => {
		style = document.createElement( 'style' );
		style.textContent = readFileSync( path.join( __dirname, '../subscribe-modal.css' ), 'utf8' );
		document.head.appendChild( style );
		document.body.style.backgroundColor = '#121212';
		document.body.style.color = '#ffffff';
	} );

	afterEach( () => {
		style.remove();
		document.body.removeAttribute( 'style' );
		document.body.innerHTML = '';
	} );

	it( 'keeps inherited theme text readable on the modal on a dark site', () => {
		document.body.innerHTML = `
			<div class="jetpack-subscribe-modal open">
				<div class="jetpack-subscribe-modal__modal-content">
					<div class="wp-block-group"><p>Discover more</p></div>
				</div>
			</div>`;

		const content = document.querySelector( '.jetpack-subscribe-modal__modal-content' );
		expect( [
			getComputedStyle( content ).backgroundColor,
			getComputedStyle( content.querySelector( 'p' ) ).color,
		] ).toEqual( [ 'rgb(254, 254, 254)', 'rgb(30, 30, 30)' ] );
	} );
} );
