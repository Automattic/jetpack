import { formatResultsCountText } from '../../../src/search-blocks/blocks/results-count/format';

describe( 'formatResultsCountText', () => {
	const VARS = { first: 1, last: 10, total: 42, query: 'boots' };

	it( 'substitutes the default template', () => {
		expect( formatResultsCountText( 'Showing %1$d–%2$d of %3$d results', VARS ) ).toBe(
			'Showing 1–10 of 42 results'
		);
	} );

	it( 'substitutes the query placeholder', () => {
		expect( formatResultsCountText( 'Showing %1$d–%2$d of %3$d results for %4$s', VARS ) ).toBe(
			'Showing 1–10 of 42 results for boots'
		);
	} );

	it( 'supports placeholders in any order and repeated', () => {
		// Exercising order + repeats together guards against a replace-sequential
		// bug (where replacing %1$d first could feed its output into a later
		// %3$d match) — each placeholder must resolve from the original string.
		expect( formatResultsCountText( '%3$d total, %4$s query, %1$d first, %3$d again', VARS ) ).toBe(
			'42 total, boots query, 1 first, 42 again'
		);
	} );

	it( 'leaves unsupported indices untouched', () => {
		// %5$d is a reasonable author typo; it must surface visibly rather than
		// being silently stripped so the mistake is debuggable on the page.
		expect( formatResultsCountText( '%1$d of %5$d (%3$d)', VARS ) ).toBe( '1 of %5$d (42)' );
		expect( formatResultsCountText( '%10$d items', VARS ) ).toBe( '%10$d items' );
	} );

	it( 'leaves unsupported specifiers untouched', () => {
		// %1$s has a known index but the wrong specifier — our map only accepts
		// exact matches, so the placeholder stays as-is.
		expect( formatResultsCountText( '%1$s plus %3$d', VARS ) ).toBe( '%1$s plus 42' );
		expect( formatResultsCountText( '%4$d plus %4$s', VARS ) ).toBe( '%4$d plus boots' );
	} );

	it( 'does not rescan substituted output for placeholders', () => {
		// If the query contains something that looks like a placeholder,
		// that substring must survive as a literal — otherwise a search for
		// "%3$d" would get rewritten to the total count on substitution.
		expect(
			formatResultsCountText( 'Query: %4$s, total: %3$d', {
				...VARS,
				query: '%3$d',
			} )
		).toBe( 'Query: %3$d, total: 42' );
	} );

	it( 'coerces non-string input safely', () => {
		expect( formatResultsCountText( null, VARS ) ).toBe( '' );
		expect( formatResultsCountText( undefined, VARS ) ).toBe( '' );
	} );

	it( 'returns templates with no placeholders unchanged', () => {
		expect( formatResultsCountText( 'Results below:', VARS ) ).toBe( 'Results below:' );
		expect( formatResultsCountText( '', VARS ) ).toBe( '' );
	} );

	it( 'coerces numeric vars to strings', () => {
		// total=0 still needs a string substitution (not a dropped placeholder);
		// the getter short-circuits at total===0 before calling the formatter,
		// but the formatter itself must handle the edge case cleanly.
		expect(
			formatResultsCountText( 'Showing %1$d–%2$d of %3$d', {
				first: 0,
				last: 0,
				total: 0,
				query: '',
			} )
		).toBe( 'Showing 0–0 of 0' );
	} );
} );
