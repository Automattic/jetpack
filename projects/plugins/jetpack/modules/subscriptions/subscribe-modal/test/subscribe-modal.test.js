const addModalMarkup = () => {
	document.body.innerHTML = `
		<p><a href="#before">Link before the pop-up</a></p>
		<div class="entry-content"><p>Post text</p></div>
		<div class="jetpack-subscribe-modal">
			<div class="jetpack-subscribe-modal__modal-content">
				<h2>Discover more from Test Site</h2>
				<form>
					<input type="email" aria-label="Email address" />
					<button type="submit">Subscribe</button>
				</form>
				<a href="#" class="jetpack-subscribe-modal__close">Continue reading</a>
			</div>
		</div>
	`;
};

const loadModalScript = () => {
	jest.isolateModules( () => {
		require( '../subscribe-modal.js' );
	} );
	jest.runOnlyPendingTimers();
};

const focusPageBehind = () => document.querySelector( 'a[href="#before"]' ).focus();

describe( 'Subscribe pop-up', () => {
	let windowListeners = [];

	beforeEach( () => {
		jest.useFakeTimers();
		window.localStorage.clear();
		global.wp = { domReady: callback => callback() };
		// jsdom has no layout, so report every element as visible; the live check covers hidden ones.
		jest.spyOn( Element.prototype, 'getClientRects' ).mockReturnValue( [ {} ] );
		// Each test loads the script again, so drop the window listeners the last copy added.
		windowListeners = [];
		const addEventListener = window.addEventListener.bind( window );
		jest.spyOn( window, 'addEventListener' ).mockImplementation( ( ...args ) => {
			windowListeners.push( args );
			addEventListener( ...args );
		} );
		global.Jetpack_Subscriptions = {
			modalLoadTime: 0,
			modalScrollThreshold: 50,
			modalInterval: 0,
			modalLabel: 'Subscribe',
		};
		addModalMarkup();
	} );

	afterEach( () => {
		windowListeners.forEach( args => window.removeEventListener( ...args ) );
		jest.restoreAllMocks();
		jest.useRealTimers();
	} );

	it( 'is a modal dialog named after its heading', () => {
		loadModalScript();

		const dialog = document.querySelector( '.jetpack-subscribe-modal__modal-content' );
		expect( dialog ).toHaveAttribute( 'role', 'dialog' );
		expect( dialog ).toHaveAttribute( 'aria-modal', 'true' );
		expect( dialog ).toHaveAccessibleName( 'Discover more from Test Site' );
	} );

	it( 'falls back to a generic name when the pop-up has no heading', () => {
		document.querySelector( '.jetpack-subscribe-modal__modal-content h2' ).remove();
		loadModalScript();

		expect(
			document.querySelector( '.jetpack-subscribe-modal__modal-content' )
		).toHaveAccessibleName( 'Subscribe' );
	} );

	it( 'moves focus into the dialog when it opens', () => {
		loadModalScript();

		const dialog = document.querySelector( '.jetpack-subscribe-modal__modal-content' );
		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).toHaveClass( 'open' );
		expect( dialog ).toContainElement( document.activeElement );
	} );

	it( 'sends focus that reaches the page behind back into the dialog', () => {
		loadModalScript();
		const email = document.querySelector( 'input[type="email"]' );
		const close = document.querySelector( '.jetpack-subscribe-modal__close' );

		close.focus();
		focusPageBehind();
		expect( email ).toHaveFocus();

		focusPageBehind();
		expect( close ).toHaveFocus();
	} );

	it( 'wraps focus that leaves from the dialog itself to its last control', () => {
		loadModalScript();
		const close = document.querySelector( '.jetpack-subscribe-modal__close' );

		focusPageBehind();

		expect( close ).toHaveFocus();
	} );

	it( 'keeps focus on the dialog when it has nothing else to focus', () => {
		document.querySelector( '.jetpack-subscribe-modal__modal-content form' ).remove();
		document.querySelector( '.jetpack-subscribe-modal__close' ).remove();
		loadModalScript();
		const dialog = document.querySelector( '.jetpack-subscribe-modal__modal-content' );

		focusPageBehind();

		expect( dialog ).toHaveFocus();
	} );

	it( 'moves focus in after the fade-in when the first try fails', () => {
		jest.spyOn( HTMLElement.prototype, 'focus' ).mockImplementationOnce( () => {} );
		loadModalScript();
		const dialog = document.querySelector( '.jetpack-subscribe-modal__modal-content' );
		expect( dialog ).not.toHaveFocus();

		dialog.dispatchEvent( new Event( 'transitionend' ) );

		expect( dialog ).toHaveFocus();
	} );

	it( 'gives focus back to the page when it closes with Escape', () => {
		loadModalScript();
		const dialog = document.querySelector( '.jetpack-subscribe-modal__modal-content' );

		window.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape' } ) );

		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).not.toHaveClass( 'open' );
		expect( dialog ).not.toContainElement( document.activeElement );
		expect( document.body ).toHaveFocus();
	} );
} );
