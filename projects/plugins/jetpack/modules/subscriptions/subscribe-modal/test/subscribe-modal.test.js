import { readFileSync } from 'fs';
import path from 'path';

const dismissedKey = 'jetpack_post_subscribe_modal_dismissed';
const loadTime = 1000;

describe( 'Subscribe modal', () => {
	let style;

	beforeEach( () => {
		jest.useFakeTimers();
		localStorage.removeItem( dismissedKey );
		window.wp = { domReady: callback => callback() };
		window.Jetpack_Subscriptions = {
			modalLoadTime: loadTime,
			modalScrollThreshold: 50,
			modalInterval: 60000,
		};
		style = document.createElement( 'style' );
		style.textContent = readFileSync( path.join( __dirname, '../subscribe-modal.css' ), 'utf8' );
		document.head.appendChild( style );
		document.body.style.backgroundColor = '#121212';
		document.body.style.color = '#ffffff';
		document.body.innerHTML = `
			<div class="jetpack-subscribe-modal">
				<div class="jetpack-subscribe-modal__modal-content">
					<div class="wp-block-group">
						<p class="jetpack-subscribe-modal__close"><a href="#">Continue reading</a></p>
					</div>
				</div>
			</div>`;
	} );

	afterEach( () => {
		window.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape' } ) );
		jest.useRealTimers();
		jest.resetModules();
		delete window.wp;
		delete window.Jetpack_Subscriptions;
		style.remove();
		document.body.removeAttribute( 'style' );
		document.body.innerHTML = '';
		localStorage.removeItem( dismissedKey );
	} );

	it( 'opens the subscribe modal with the site background color', () => {
		require( '../subscribe-modal.js' );
		jest.advanceTimersByTime( loadTime );

		const content = document.querySelector( '.jetpack-subscribe-modal__modal-content' );
		expect( getComputedStyle( content ).backgroundColor ).toBe( 'rgb(18, 18, 18)' );
	} );
} );
