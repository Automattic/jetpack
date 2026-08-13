const siteId = 123;
const knownSubscriberKey = `jetpack_post_subscribe_known_subscriber_${ siteId }`;
const modalDismissedKey = 'jetpack_post_subscribe_modal_dismissed';
const overlayDismissedKey = 'jetpack_post_subscribe_overlay_dismissed';
const skipUrlParam = 'jetpack_skip_subscription_popup';
const oneDay = 24 * 60 * 60 * 1000;

function visitSubscriberEmailLink() {
	window.history.replaceState( {}, '', `/?${ skipUrlParam }` );
}

describe( 'subscriber email prompt suppression', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.setSystemTime( new Date( '2026-08-13T12:00:00Z' ) );
		jest.resetModules();
		localStorage.clear();
		document.body.innerHTML = '';
		document.cookie = `${ overlayDismissedKey }=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
		document.cookie = `${ knownSubscriberKey }=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
		window.history.replaceState( {}, '', '/' );
		global.wp = { domReady: callback => callback() };
		global.Jetpack_Subscriptions = {
			siteId,
			modalInterval: oneDay,
			modalLoadTime: 0,
			modalScrollThreshold: 50,
		};
		global.Jetpack_Subscribe_Overlay = { siteId };
	} );

	afterEach( () => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
		jest.restoreAllMocks();
		delete global.wp;
		delete global.Jetpack_Subscriptions;
		delete global.Jetpack_Subscribe_Overlay;
	} );

	it( 'keeps the subscribe modal suppressed after a subscriber email visit', () => {
		localStorage.setItem( modalDismissedKey, Date.now() );
		visitSubscriberEmailLink();

		require( '../subscribe-modal/subscribe-modal' );

		expect( localStorage.getItem( knownSubscriberKey ) ).toBe( 'true' );
		expect( window.location.search ).toBe( '' );

		jest.resetModules();
		jest.setSystemTime( Date.now() + oneDay + 1 );
		document.body.innerHTML = `
			<div class="entry-content"></div>
			<div class="jetpack-subscribe-modal">
				<a class="jetpack-subscribe-modal__close" href="#">Close</a>
			</div>
		`;
		window.history.replaceState( {}, '', '/' );
		require( '../subscribe-modal/subscribe-modal' );
		jest.runOnlyPendingTimers();

		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).not.toHaveClass( 'open' );
	} );

	it( 'keeps the subscribe overlay suppressed after a subscriber email visit', () => {
		document.cookie = `${ overlayDismissedKey }=true; path=/;`;
		visitSubscriberEmailLink();

		require( '../subscribe-overlay/subscribe-overlay' );

		expect( localStorage.getItem( knownSubscriberKey ) ).toBe( 'true' );
		expect( window.location.search ).toBe( '' );

		jest.resetModules();
		document.body.innerHTML = `
			<div class="jetpack-subscribe-overlay">
				<a class="jetpack-subscribe-overlay__close" href="#">Close</a>
			</div>
		`;
		document.cookie = `${ overlayDismissedKey }=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
		window.history.replaceState( {}, '', '/' );
		require( '../subscribe-overlay/subscribe-overlay' );

		expect( document.querySelector( '.jetpack-subscribe-overlay' ) ).not.toHaveClass( 'open' );
	} );

	it( 'closes a pending modal when another tab identifies the visitor as a subscriber', () => {
		document.body.innerHTML = `
			<div class="entry-content"></div>
			<div class="jetpack-subscribe-modal">
				<a class="jetpack-subscribe-modal__close" href="#">Close</a>
			</div>
		`;
		global.Jetpack_Subscriptions.modalLoadTime = oneDay;
		require( '../subscribe-modal/subscribe-modal' );

		window.dispatchEvent(
			new StorageEvent( 'storage', { key: knownSubscriberKey, newValue: 'true' } )
		);
		jest.runOnlyPendingTimers();

		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).not.toHaveClass( 'open' );
	} );

	it( 'does not reopen the modal from a queued animation frame after another tab identifies the visitor', () => {
		let queuedAnimationFrame;
		jest.spyOn( window, 'requestAnimationFrame' ).mockImplementation( callback => {
			queuedAnimationFrame = callback;
		} );
		document.body.innerHTML = `
			<div class="entry-content"></div>
			<div class="jetpack-subscribe-modal">
				<a class="jetpack-subscribe-modal__close" href="#">Close</a>
			</div>
		`;
		global.Jetpack_Subscriptions.modalLoadTime = oneDay;
		require( '../subscribe-modal/subscribe-modal' );
		window.dispatchEvent( new Event( 'scroll' ) );
		localStorage.setItem( knownSubscriberKey, 'true' );
		window.dispatchEvent(
			new StorageEvent( 'storage', { key: knownSubscriberKey, newValue: 'true' } )
		);

		queuedAnimationFrame();

		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).not.toHaveClass( 'open' );
	} );

	it( 'uses a persistent site-specific cookie when local storage is unavailable', () => {
		const cookieSetter = jest.spyOn( document, 'cookie', 'set' );
		jest.spyOn( Storage.prototype, 'getItem' ).mockImplementation( () => {
			throw new DOMException( 'Blocked', 'SecurityError' );
		} );
		jest.spyOn( Storage.prototype, 'setItem' ).mockImplementation( () => {
			throw new DOMException( 'Blocked', 'SecurityError' );
		} );
		visitSubscriberEmailLink();

		require( '../subscribe-modal/subscribe-modal' );

		expect( document.cookie ).toContain( `${ knownSubscriberKey }=true` );
		expect( cookieSetter ).toHaveBeenCalledWith( expect.stringContaining( 'max-age=31536000' ) );
		expect( cookieSetter ).toHaveBeenCalledWith( expect.stringContaining( 'SameSite=Lax' ) );
		expect( window.location.search ).toBe( '' );

		jest.resetModules();
		document.body.innerHTML = `
			<div class="entry-content"></div>
			<div class="jetpack-subscribe-modal">
				<a class="jetpack-subscribe-modal__close" href="#">Close</a>
			</div>
		`;
		require( '../subscribe-modal/subscribe-modal' );
		jest.runOnlyPendingTimers();

		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).not.toHaveClass( 'open' );
	} );

	it( 'uses a persistent site-specific cookie for the overlay when local storage is unavailable', () => {
		const cookieSetter = jest.spyOn( document, 'cookie', 'set' );
		jest.spyOn( Storage.prototype, 'getItem' ).mockImplementation( () => {
			throw new DOMException( 'Blocked', 'SecurityError' );
		} );
		jest.spyOn( Storage.prototype, 'setItem' ).mockImplementation( () => {
			throw new DOMException( 'Blocked', 'SecurityError' );
		} );
		visitSubscriberEmailLink();

		require( '../subscribe-overlay/subscribe-overlay' );

		expect( document.cookie ).toContain( `${ knownSubscriberKey }=true` );
		expect( cookieSetter ).toHaveBeenCalledWith( expect.stringContaining( 'max-age=31536000' ) );
		expect( cookieSetter ).toHaveBeenCalledWith( expect.stringContaining( 'SameSite=Lax' ) );
		expect( window.location.search ).toBe( '' );

		jest.resetModules();
		document.body.innerHTML = `
			<div class="jetpack-subscribe-overlay">
				<a class="jetpack-subscribe-overlay__close" href="#">Close</a>
			</div>
		`;
		require( '../subscribe-overlay/subscribe-overlay' );

		expect( document.querySelector( '.jetpack-subscribe-overlay' ) ).not.toHaveClass( 'open' );
	} );

	it( 'shows the overlay when local storage is unavailable without a subscriber cookie', () => {
		jest.spyOn( Storage.prototype, 'getItem' ).mockImplementation( () => {
			throw new DOMException( 'Blocked', 'SecurityError' );
		} );
		document.body.innerHTML = `
			<div class="jetpack-subscribe-overlay">
				<a class="jetpack-subscribe-overlay__close" href="#">Close</a>
			</div>
		`;

		require( '../subscribe-overlay/subscribe-overlay' );

		expect( document.querySelector( '.jetpack-subscribe-overlay' ) ).toHaveClass( 'open' );
		window.dispatchEvent(
			new StorageEvent( 'storage', { key: knownSubscriberKey, newValue: 'true' } )
		);
	} );

	it( 'closes prompts on focus when another tab sets the fallback cookie', () => {
		jest.spyOn( Storage.prototype, 'getItem' ).mockImplementation( () => {
			throw new DOMException( 'Blocked', 'SecurityError' );
		} );
		document.body.innerHTML = `
			<div class="entry-content"></div>
			<div class="jetpack-subscribe-modal">
				<a class="jetpack-subscribe-modal__close" href="#">Close</a>
			</div>
			<div class="jetpack-subscribe-overlay">
				<a class="jetpack-subscribe-overlay__close" href="#">Close</a>
			</div>
		`;

		require( '../subscribe-modal/subscribe-modal' );
		require( '../subscribe-overlay/subscribe-overlay' );
		jest.runOnlyPendingTimers();
		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).toHaveClass( 'open' );
		expect( document.querySelector( '.jetpack-subscribe-overlay' ) ).toHaveClass( 'open' );

		document.cookie = `${ knownSubscriberKey }=true; max-age=31536000; path=/; SameSite=Lax`;
		window.dispatchEvent( new Event( 'focus' ) );

		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).not.toHaveClass( 'open' );
		expect( document.querySelector( '.jetpack-subscribe-overlay' ) ).not.toHaveClass( 'open' );
	} );
} );
