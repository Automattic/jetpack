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
		document.documentElement.removeAttribute( 'style' );
		document.body.innerHTML = '';
		localStorage.removeItem( dismissedKey );
	} );

	it.each( [
		[ 'light text on a dark body', '#121212', '', '#ffffff', 'rgb(18, 18, 18)' ],
		[ 'dark text on a dark body', '#121212', '', '#121212', 'rgb(254, 254, 254)' ],
		[
			'a transparent body over a dark root',
			'rgba(255, 255, 255, 0)',
			'#121212',
			'#ffffff',
			'rgb(18, 18, 18)',
		],
	] )(
		'opens the subscribe modal with the site background color: %s',
		( _, body, root, text, expected ) => {
			document.body.style.backgroundColor = body;
			document.body.style.color = text;
			document.documentElement.style.backgroundColor = root;
			require( '../subscribe-modal.js' );
			jest.advanceTimersByTime( loadTime );

			const content = document.querySelector( '.jetpack-subscribe-modal__modal-content' );
			expect( getComputedStyle( content ).backgroundColor ).toBe( expected );
		}
	);
} );
