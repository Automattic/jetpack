/**
 * @jest-environment jsdom
 */

import {
	setupJetpackSearchCorrectedQuery,
	resetJetpackSearchCorrectedQuery,
	createElementFromHtml,
	applyStyles,
} from './helpers';

describe( 'Helpers', () => {
	describe( 'setupJetpackSearchCorrectedQuery', () => {
		afterEach( () => {
			delete window.JetpackSearchCorrectedQuery;
		} );

		test( 'sets JetpackSearchCorrectedQuery on window', () => {
			const testData = { test: 'data' };
			setupJetpackSearchCorrectedQuery( testData );
			expect( window.JetpackSearchCorrectedQuery ).toEqual( testData );
		} );
	} );

	describe( 'resetJetpackSearchCorrectedQuery', () => {
		test( 'removes JetpackSearchCorrectedQuery from window', () => {
			window.JetpackSearchCorrectedQuery = { test: 'data' };
			resetJetpackSearchCorrectedQuery();
			expect( window.JetpackSearchCorrectedQuery ).toBeUndefined();
		} );
	} );

	describe( 'createElementFromHtml', () => {
		test( 'creates element from HTML string', () => {
			const html = '<div class="test">Test Content</div>';
			const element = createElementFromHtml( html );
			expect( element.tagName ).toBe( 'DIV' );
			expect( element.className ).toBe( 'test' );
			expect( element ).toHaveTextContent( 'Test Content' );
		} );

		test( 'returns first child element', () => {
			const html = '<div>First</div><div>Second</div>';
			const element = createElementFromHtml( html );
			expect( element ).toHaveTextContent( 'First' );
		} );
	} );

	describe( 'applyStyles', () => {
		test( 'applies styles to element', () => {
			const element = document.createElement( 'div' );
			const styles = {
				color: 'red',
				backgroundColor: 'blue',
			};
			applyStyles( element, styles );
			expect( element ).toHaveStyle( { color: 'red' } );
			expect( element ).toHaveStyle( { backgroundColor: 'blue' } );
		} );
	} );
} );
