import { displayCorrectedQuery } from '../corrected-query';

describe( 'displayCorrectedQuery', () => {
	beforeEach( () => {
		document.body.innerHTML = '<h1 class="page-title">Search results for: hello</h1>';
	} );

	afterEach( () => {
		document.body.innerHTML = '';
		delete window.JetpackSearchCorrectedQuery;
	} );

	test( 'inserts a text notice after the title', () => {
		displayCorrectedQuery( {
			message: 'No results for "typo"',
			selectors: [ '.page-title' ],
		} );

		const notice = document.querySelector( '.jetpack-search-corrected-query' );
		expect( notice ).not.toBeNull();
		expect( notice.tagName ).toBe( 'P' );
		expect( notice ).toHaveTextContent( 'No results for "typo"' );
		expect( document.querySelector( '.page-title' ).nextElementSibling ).toBe( notice );
	} );

	test( 'does not parse HTML from a reflected XSS search query', () => {
		const xssPayload = '<img src=x onerror=alert(1)>';
		displayCorrectedQuery( {
			message: `No results for "${ xssPayload }"`,
			selectors: [ '.page-title' ],
		} );

		const notice = document.querySelector( '.jetpack-search-corrected-query' );
		expect( notice ).not.toBeNull();
		expect( notice.querySelectorAll( 'img' ) ).toHaveLength( 0 );
		expect( notice.children ).toHaveLength( 0 );
		expect( notice ).toHaveTextContent( xssPayload );
		expect( notice.innerHTML ).toBe( 'No results for "&lt;img src=x onerror=alert(1)&gt;"' );
	} );

	test( 'does nothing when message is missing', () => {
		displayCorrectedQuery( { selectors: [ '.page-title' ] } );
		expect( document.querySelector( '.jetpack-search-corrected-query' ) ).toBeNull();
	} );

	test( 'does nothing when no title selector matches', () => {
		displayCorrectedQuery( {
			message: 'No results for "typo"',
			selectors: [ '.missing-title' ],
		} );
		expect( document.querySelector( '.jetpack-search-corrected-query' ) ).toBeNull();
	} );
} );
