/**
 * @jest-environment jsdom
 */

import {
	setupJetpackSearchCorrectedQuery,
	resetJetpackSearchCorrectedQuery,
	createElementFromHtml,
	applyStyles,
} from '../helpers';

describe( 'Corrected Query Notice', () => {
	// Test constants
	const TEST_HTML = '<div class="corrected-query">Did you mean: example?</div>';
	const TEST_SELECTORS = [ '.search-title' ];
	const TEST_TITLE_HTML = '<h1 class="search-title">Search Results</h1>';
	const TEST_TITLE_WITH_CLASS_HTML = '<h1 class="search-title custom-class">Search Results</h1>';
	const NOTICE_STYLES = {
		fontSize: '0.9em',
		marginTop: '10px',
		paddingTop: '0',
	};

	let originalJetpackSearchCorrectedQuery;

	/**
	 * Adds a corrected query notice after search titles when correction data is available.
	 */
	function correctedQueryFunction() {
		// Get query data and validate
		const queryData = window.JetpackSearchCorrectedQuery;
		if ( ! queryData?.html || ! queryData?.selectors?.length ) {
			return;
		}

		// Find title element using selectors
		const titleElement = document.querySelector( queryData.selectors.join( ', ' ) );
		if ( ! titleElement ) {
			return;
		}

		// Create and configure notice element
		const noticeElement = createElementFromHtml( queryData.html );
		noticeElement.className = `${ titleElement.className } ${ noticeElement.className }`;
		applyStyles( noticeElement, NOTICE_STYLES );

		// Insert notice after title
		titleElement.insertAdjacentElement( 'afterend', noticeElement );
	}

	beforeEach( () => {
		// Store original state
		originalJetpackSearchCorrectedQuery = window.JetpackSearchCorrectedQuery;
		// Reset test environment
		document.body.innerHTML = '';
		resetJetpackSearchCorrectedQuery();
	} );

	afterEach( () => {
		// Restore original state
		if ( originalJetpackSearchCorrectedQuery ) {
			setupJetpackSearchCorrectedQuery( originalJetpackSearchCorrectedQuery );
		} else {
			resetJetpackSearchCorrectedQuery();
		}
	} );

	describe( 'when JetpackSearchCorrectedQuery is not properly configured', () => {
		test( 'should not add notice when JetpackSearchCorrectedQuery is not defined', () => {
			document.body.innerHTML = TEST_TITLE_HTML;
			correctedQueryFunction();
			expect( document.querySelector( '.corrected-query' ) ).toBeNull();
		} );

		test( 'should not add notice when JetpackSearchCorrectedQuery has no html', () => {
			setupJetpackSearchCorrectedQuery( { selectors: TEST_SELECTORS } );
			document.body.innerHTML = TEST_TITLE_HTML;
			correctedQueryFunction();
			expect( document.querySelector( '.corrected-query' ) ).toBeNull();
		} );

		test( 'should not add notice when no matching selector is found', () => {
			setupJetpackSearchCorrectedQuery( {
				selectors: [ '.non-existent-selector' ],
				html: TEST_HTML,
			} );
			document.body.innerHTML = TEST_TITLE_HTML;
			correctedQueryFunction();
			expect( document.querySelector( '.corrected-query' ) ).toBeNull();
		} );

		test( 'should not add notice when selectors array is empty', () => {
			setupJetpackSearchCorrectedQuery( {
				selectors: [],
				html: TEST_HTML,
			} );
			document.body.innerHTML = TEST_TITLE_HTML;
			correctedQueryFunction();
			expect( document.querySelector( '.corrected-query' ) ).toBeNull();
		} );
	} );

	describe( 'when JetpackSearchCorrectedQuery is properly configured', () => {
		test( 'should add notice with correct styling when all conditions are met', () => {
			setupJetpackSearchCorrectedQuery( {
				selectors: TEST_SELECTORS,
				html: TEST_HTML,
			} );
			document.body.innerHTML = TEST_TITLE_WITH_CLASS_HTML;
			correctedQueryFunction();

			const notice = document.querySelector( '.corrected-query' );
			expect( notice ).not.toBeNull();
			expect( notice ).toHaveClass( 'custom-class', 'corrected-query' );
			expect( notice ).toHaveStyle( NOTICE_STYLES );
			expect( notice ).toHaveTextContent( 'Did you mean: example?' );
		} );

		test( 'should handle multiple selectors', () => {
			setupJetpackSearchCorrectedQuery( {
				selectors: [ '.non-existent', '.search-title' ],
				html: TEST_HTML,
			} );
			document.body.innerHTML = TEST_TITLE_HTML;
			correctedQueryFunction();

			const notice = document.querySelector( '.corrected-query' );
			expect( notice ).not.toBeNull();
			expect( notice ).toHaveClass( 'corrected-query' );
			expect( notice ).toHaveStyle( NOTICE_STYLES );
		} );

		test( 'should preserve original notice class when adding title classes', () => {
			setupJetpackSearchCorrectedQuery( {
				selectors: TEST_SELECTORS,
				html: TEST_HTML,
			} );
			document.body.innerHTML = TEST_TITLE_WITH_CLASS_HTML;
			correctedQueryFunction();

			const notice = document.querySelector( '.corrected-query' );
			expect( notice.className ).toContain( 'search-title' );
			expect( notice.className ).toContain( 'custom-class' );
			expect( notice.className ).toContain( 'corrected-query' );
		} );
	} );
} );
