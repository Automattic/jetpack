const SHARE_URL = 'https://example.com/a-post/';

/**
 * Render the block's rendered markup for a set of services.
 *
 * @param {string[]} services - Service slugs to render buttons for.
 */
function renderButtons( services ) {
	const items = services
		.map(
			service =>
				`<li class="jetpack-sharing-button__list-item"><a href="${ SHARE_URL }?share=${ service }&nb=1" target="_blank" rel="nofollow noopener noreferrer" class="jetpack-sharing-button__button style-icon-text share-${ service }" data-service="${ service }" data-shared="sharing-${ service }-1"><span class="jetpack-sharing-button__service-label" aria-hidden="true">${ service }</span></a></li>`
		)
		.join( '' );

	document.body.innerHTML = `<ul class="wp-block-jetpack-sharing-buttons jetpack-sharing-buttons__services-list">${ items }</ul>`;
}

/**
 * Evaluate view.js against the current DOM, as a fresh page load would.
 */
function loadView() {
	jest.isolateModules( () => {
		require( '../view.js' );
	} );
}

/**
 * Click a service's share link.
 *
 * @param {string} service - Service slug.
 * @param {string} within  - Optional selector for a descendant of the link to click instead.
 */
function clickShare( service, within ) {
	const link = document.querySelector( `a.share-${ service }` );
	( within ? link.querySelector( within ) : link ).click();
}

describe( 'sharing buttons block popups', () => {
	let openedPopups;

	beforeEach( () => {
		openedPopups = [];
		jest.spyOn( window, 'open' ).mockImplementation( ( url, name, features ) => {
			const popup = { url, name, features, close: jest.fn(), focus: jest.fn() };
			openedPopups.push( popup );
			return popup;
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		document.body.innerHTML = '';
	} );

	it( 'opens the share link in a popup', () => {
		renderButtons( [ 'x' ] );
		loadView();

		clickShare( 'x' );

		expect( window.open ).toHaveBeenCalledTimes( 1 );
		expect( openedPopups[ 0 ].url ).toBe( `${ SHARE_URL }?share=x&nb=1` );
		expect( openedPopups[ 0 ].features ).toBe( 'menubar=1,resizable=1,width=600,height=400' );
		expect( openedPopups[ 0 ].focus ).toHaveBeenCalled();
	} );

	it( 'names the popup unpredictably rather than after the service alone', () => {
		renderButtons( [ 'x' ] );
		loadView();

		clickShare( 'x' );

		expect( openedPopups[ 0 ].name ).not.toBe( 'wpcomx' );
		expect( openedPopups[ 0 ].name ).toMatch( /^wpcomx-.+/ );
	} );

	it( 'reuses one name for repeat clicks on the same service', () => {
		renderButtons( [ 'x' ] );
		loadView();

		clickShare( 'x' );
		clickShare( 'x' );

		expect( openedPopups ).toHaveLength( 2 );
		expect( openedPopups[ 1 ].name ).toBe( openedPopups[ 0 ].name );
	} );

	it( 'gives each service its own name', () => {
		renderButtons( [ 'x', 'facebook' ] );
		loadView();

		clickShare( 'x' );
		clickShare( 'facebook' );

		expect( openedPopups[ 1 ].name ).not.toBe( openedPopups[ 0 ].name );
		expect( openedPopups[ 1 ].name ).toMatch( /^wpcomfacebook-.+/ );
	} );

	it( 'picks a new name on the next page load', () => {
		renderButtons( [ 'x' ] );
		loadView();
		clickShare( 'x' );

		renderButtons( [ 'x' ] );
		loadView();
		clickShare( 'x' );

		expect( openedPopups[ 1 ].name ).not.toBe( openedPopups[ 0 ].name );
	} );

	it( 'closes the popup it opened before', () => {
		renderButtons( [ 'x', 'facebook' ] );
		loadView();

		clickShare( 'x' );
		clickShare( 'facebook' );

		expect( openedPopups[ 0 ].close ).toHaveBeenCalled();
		expect( openedPopups[ 1 ].close ).not.toHaveBeenCalled();
	} );

	it( 'opens from a click on an element inside the link', () => {
		renderButtons( [ 'x' ] );
		loadView();

		clickShare( 'x', '.jetpack-sharing-button__service-label' );

		expect( window.open ).toHaveBeenCalledTimes( 1 );
		expect( openedPopups[ 0 ].name ).toMatch( /^wpcomx-.+/ );
	} );

	it( 'leaves print, mail and native share alone', () => {
		renderButtons( [ 'print', 'mail', 'share' ] );
		jest.spyOn( window, 'print' ).mockImplementation( () => {} );
		loadView();

		clickShare( 'mail' );
		expect( window.open ).not.toHaveBeenCalled();

		clickShare( 'print' );
		expect( window.print ).toHaveBeenCalled();
		expect( window.open ).not.toHaveBeenCalled();

		clickShare( 'share' );
		expect( window.open ).not.toHaveBeenCalled();
	} );
} );
