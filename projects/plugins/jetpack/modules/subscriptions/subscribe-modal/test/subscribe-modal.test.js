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

const pressTab = ( shiftKey = false ) =>
	document.activeElement.dispatchEvent(
		new KeyboardEvent( 'keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true } )
	);

describe( 'Subscribe pop-up', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		window.localStorage.clear();
		// jsdom has no layout, so @wordpress/dom would see every element as hidden; the live check covers that.
		global.wp = {
			domReady: callback => callback(),
			dom: {
				focus: {
					tabbable: {
						find: element => Array.from( element.querySelectorAll( 'a[href], button, input' ) ),
					},
				},
			},
		};
		global.Jetpack_Subscriptions = {
			modalLoadTime: 0,
			modalScrollThreshold: 50,
			modalInterval: 0,
			modalLabel: 'Subscribe',
		};
		addModalMarkup();
	} );

	afterEach( () => {
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

	it( 'keeps Tab and Shift+Tab inside the dialog', () => {
		loadModalScript();
		const email = document.querySelector( 'input[type="email"]' );
		const close = document.querySelector( '.jetpack-subscribe-modal__close' );

		close.focus();
		pressTab();
		expect( email ).toHaveFocus();

		pressTab( true );
		expect( close ).toHaveFocus();
	} );

	it( 'gives focus back when it closes with Escape', () => {
		loadModalScript();
		const dialog = document.querySelector( '.jetpack-subscribe-modal__modal-content' );

		window.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape' } ) );

		expect( document.querySelector( '.jetpack-subscribe-modal' ) ).not.toHaveClass( 'open' );
		expect( dialog ).not.toContainElement( document.activeElement );
	} );
} );
