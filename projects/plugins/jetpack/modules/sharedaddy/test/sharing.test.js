/**
 * Tests for the delegated share-popup click handler in sharing.js.
 *
 * Services that open their share link in a popup register their window features in
 * `window.WPCOM_sharing_popups`; a single delegated listener opens the popup. sharing.js
 * is a side-effect-only IIFE, so it is required once here and the listener it binds to
 * `document` is exercised by dispatching real click events.
 */

require( '../sharing' );

describe( 'Share popups', () => {
	let openSpy;

	const newPopup = () => ( { close: jest.fn(), closed: false } );

	// Mirrors the markup Sharing_Source::get_link() renders for a popup service.
	const addShareButton = service => {
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'sharedaddy sd-sharing-enabled';
		wrapper.innerHTML =
			'<div class="sd-content"><ul><li>' +
			'<a rel="nofollow noopener noreferrer" class="share-' +
			service +
			' sd-button share-icon" href="https://example.com/post/?share=' +
			service +
			'&nb=1" target="_blank">' +
			'<span hidden>Share on ' +
			service +
			'</span><span class="label">' +
			service +
			'</span>' +
			'</a></li></ul></div>';

		document.body.appendChild( wrapper );

		return wrapper.querySelector( 'a' );
	};

	const click = node => {
		const event = new MouseEvent( 'click', { bubbles: true, cancelable: true } );
		node.dispatchEvent( event );
		return event;
	};

	beforeEach( () => {
		document.body.innerHTML = '';

		window.WPCOM_sharing_popups = {
			x: 'menubar=1,resizable=1,width=600,height=350',
			telegram: 'menubar=1,resizable=1,width=450,height=450',
		};

		openSpy = jest.spyOn( window, 'open' ).mockImplementation( newPopup );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		delete window.WPCOM_sharing_popups;
	} );

	it( "opens exactly one popup with the service's own window features", () => {
		const link = addShareButton( 'x' );

		const event = click( link );

		expect( event.defaultPrevented ).toBe( true );
		expect( openSpy ).toHaveBeenCalledTimes( 1 );
		expect( openSpy ).toHaveBeenCalledWith(
			'https://example.com/post/?share=x&nb=1',
			expect.stringMatching( /^wpcomx-/ ),
			'menubar=1,resizable=1,width=600,height=350'
		);
	} );

	it( 'opens the popup when the click lands on the label inside the link', () => {
		const link = addShareButton( 'x' );

		const event = click( link.querySelector( '.label' ) );

		expect( event.defaultPrevented ).toBe( true );
		expect( openSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'ignores clicks nested deeper than one element inside the link', () => {
		// The Sharing Buttons block reuses the `share-<service>` classes but opts out of
		// popups, and its icon is an SVG whose glyph sits several levels down.
		const link = addShareButton( 'x' );
		const icon = document.createElement( 'span' );
		icon.innerHTML = '<span class="glyph"></span>';
		link.appendChild( icon );

		const event = click( icon.querySelector( '.glyph' ) );

		expect( event.defaultPrevented ).toBe( false );
		expect( openSpy ).not.toHaveBeenCalled();
	} );

	it( 'ignores links for services that did not register a popup', () => {
		const event = click( addShareButton( 'print' ) );

		expect( event.defaultPrevented ).toBe( false );
		expect( openSpy ).not.toHaveBeenCalled();
	} );

	it( 'ignores `share-` classes that are not services, such as the More toggle', () => {
		const event = click( addShareButton( 'more' ) );

		expect( event.defaultPrevented ).toBe( false );
		expect( openSpy ).not.toHaveBeenCalled();
	} );

	it( 'does not treat inherited object properties as registered services', () => {
		const event = click( addShareButton( 'constructor' ) );

		expect( event.defaultPrevented ).toBe( false );
		expect( openSpy ).not.toHaveBeenCalled();
	} );

	it( 'does nothing when no service registered a popup at all', () => {
		delete window.WPCOM_sharing_popups;

		const event = click( addShareButton( 'x' ) );

		expect( event.defaultPrevented ).toBe( false );
		expect( openSpy ).not.toHaveBeenCalled();
	} );

	it( 'reuses the same window name for repeat clicks on one service', () => {
		const link = addShareButton( 'x' );

		click( link );
		click( link );

		expect( openSpy ).toHaveBeenCalledTimes( 2 );
		const [ firstName, secondName ] = openSpy.mock.calls.map( call => call[ 1 ] );
		expect( secondName ).toBe( firstName );
	} );

	it( 'closes the open popup before opening another service, and names them apart', () => {
		const firstPopup = newPopup();
		openSpy.mockImplementationOnce( () => firstPopup );

		click( addShareButton( 'x' ) );
		click( addShareButton( 'telegram' ) );

		expect( firstPopup.close ).toHaveBeenCalledTimes( 1 );
		const [ xCall, telegramCall ] = openSpy.mock.calls;
		expect( xCall[ 1 ] ).not.toBe( telegramCall[ 1 ] );
		expect( telegramCall[ 2 ] ).toBe( 'menubar=1,resizable=1,width=450,height=450' );
	} );

	it( 'survives a blocked popup instead of throwing on the next click', () => {
		openSpy.mockImplementation( () => null );
		const link = addShareButton( 'x' );

		click( link );

		expect( () => click( link ) ).not.toThrow();
		expect( openSpy ).toHaveBeenCalledTimes( 2 );
	} );
} );
