/**
 * Internal dependencies
 */
import { withoutYear } from '../php-format';

describe( 'withoutYear', () => {
	// Real `date_format` defaults taken from the WordPress core language packs,
	// so the cases below are the strings sites actually ship with.
	it( 'drops a trailing year and the separator that introduces it', () => {
		expect( withoutYear( 'F j, Y' ) ).toBe( 'F j' );
	} );

	it( 'drops a leading year and the separator that follows it', () => {
		// Year-first formats are offered in Settings → General, so the run to
		// remove is the one after the year rather than before it.
		expect( withoutYear( 'Y-m-d' ) ).toBe( 'm-d' );
	} );

	it( 'keeps escaped literals that spell out token characters', () => {
		// es_ES. `\d` and `\e` are the literal word "de"; a tokenizer that misses
		// the backslash reads them as the day and timezone tokens instead.
		expect( withoutYear( 'j \\d\\e F \\d\\e Y' ) ).toBe( 'j \\d\\e F' );
	} );

	it( 'keeps a non-ASCII separator bound to the month token', () => {
		// he_IL.
		expect( withoutYear( 'j בF Y' ) ).toBe( 'j בF' );
	} );

	it( 'drops a literal that trails the year', () => {
		// A Russian-style format: "г." abbreviates "year", so it has nothing
		// left to qualify once the year is gone.
		expect( withoutYear( 'j F Y г.' ) ).toBe( 'j F' );
	} );

	it( 'removes the year from an all-numeric format', () => {
		expect( withoutYear( 'd/m/Y' ) ).toBe( 'd/m' );
	} );

	it( 'removes a two-digit year token', () => {
		expect( withoutYear( 'd/m/y' ) ).toBe( 'd/m' );
	} );

	it( 'removes the ISO week-numbering year token', () => {
		expect( withoutYear( 'j F o' ) ).toBe( 'j F' );
	} );

	it( 'leaves an escaped year character alone and removes only the real token', () => {
		expect( withoutYear( '\\Y j F Y' ) ).toBe( '\\Y j F' );
	} );

	it( 'returns the format unchanged when it carries no year', () => {
		expect( withoutYear( 'F j' ) ).toBe( 'F j' );
	} );

	it( 'returns an empty string when the format is only a year', () => {
		expect( withoutYear( 'Y' ) ).toBe( '' );
	} );

	it( 'keeps the month ordinal dot in Finnish and Czech formats', () => {
		expect( withoutYear( 'j.n.Y' ) ).toBe( 'j.n.' );
		expect( withoutYear( 'j. n. Y' ) ).toBe( 'j. n.' );
	} );
} );
