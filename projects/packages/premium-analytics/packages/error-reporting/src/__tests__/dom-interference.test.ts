import { detectDomInterference } from '../dom-interference';

describe( 'detectDomInterference', () => {
	afterEach( () => {
		document.documentElement.className = '';
		document.body.innerHTML = '';
	} );

	it( 'detects nothing on an untouched page', () => {
		expect( detectDomInterference() ).toBeUndefined();
	} );

	it( 'detects Google Translate from the class it puts on the document', () => {
		document.documentElement.classList.add( 'translated-ltr' );

		expect( detectDomInterference() ).toBe( 'google-translate' );
	} );

	it( 'detects Google Translate from the font elements it wraps text in', () => {
		document.body.innerHTML = '<font style="vertical-align: inherit;">translated</font>';

		expect( detectDomInterference() ).toBe( 'google-translate' );
	} );

	it.each( [
		[ 'edge-translate', '<span _msttexthash="123">x</span>' ],
		[ 'immersive-translate', '<span class="immersive-translate-target">x</span>' ],
		[ 'grammarly', '<div data-gr-ext-installed=""></div>' ],
		[ 'dark-reader', '<style class="darkreader"></style>' ],
	] )( 'detects %s', ( expected, markup ) => {
		document.body.innerHTML = markup;

		expect( detectDomInterference() ).toBe( expected );
	} );

	it( 'names every agent it finds', () => {
		document.documentElement.classList.add( 'translated-rtl' );
		document.body.innerHTML = '<div data-gr-ext-installed=""></div>';

		expect( detectDomInterference() ).toBe( 'google-translate,grammarly' );
	} );
} );
