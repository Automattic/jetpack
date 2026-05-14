import { formatWpDate } from '../../../src/search-blocks/store/wp-date-format';

const APR_20_2026 = new Date( Date.UTC( 2026, 3, 20, 10, 30, 45 ) );

describe( 'formatWpDate', () => {
	it( 'formats the WP default F j, Y', () => {
		expect( formatWpDate( APR_20_2026, 'F j, Y', 'en-US' ) ).toBe( 'April 20, 2026' );
	} );

	it( 'formats ISO Y-m-d', () => {
		expect( formatWpDate( APR_20_2026, 'Y-m-d', 'en-US' ) ).toBe( '2026-04-20' );
	} );

	it( 'formats European d/m/Y', () => {
		expect( formatWpDate( APR_20_2026, 'd/m/Y', 'en-US' ) ).toBe( '20/04/2026' );
	} );

	it( 'formats US m/d/Y', () => {
		expect( formatWpDate( APR_20_2026, 'm/d/Y', 'en-US' ) ).toBe( '04/20/2026' );
	} );

	it( 'formats no-leading-zero n/j/Y', () => {
		expect( formatWpDate( APR_20_2026, 'n/j/y', 'en-US' ) ).toBe( '4/20/26' );
	} );

	it( 'formats short weekday and short month (D M j Y)', () => {
		// April 20, 2026 is a Monday.
		expect( formatWpDate( APR_20_2026, 'D M j Y', 'en-US' ) ).toBe( 'Mon Apr 20 2026' );
	} );

	it( 'formats full weekday and ordinal day (l, F jS Y)', () => {
		expect( formatWpDate( APR_20_2026, 'l, F jS Y', 'en-US' ) ).toBe( 'Monday, April 20th 2026' );
	} );

	it( 'emits the correct ordinal suffix across the 11/12/13 exception', () => {
		const eleventh = new Date( Date.UTC( 2026, 0, 11 ) );
		const twelfth = new Date( Date.UTC( 2026, 0, 12 ) );
		const thirteenth = new Date( Date.UTC( 2026, 0, 13 ) );
		const twentyFirst = new Date( Date.UTC( 2026, 0, 21 ) );
		expect( formatWpDate( eleventh, 'jS', 'en-US' ) ).toBe( '11th' );
		expect( formatWpDate( twelfth, 'jS', 'en-US' ) ).toBe( '12th' );
		expect( formatWpDate( thirteenth, 'jS', 'en-US' ) ).toBe( '13th' );
		expect( formatWpDate( twentyFirst, 'jS', 'en-US' ) ).toBe( '21st' );
	} );

	it( 'localizes month names while keeping the layout order', () => {
		// May 4, 2026 — French long month is "mai".
		const may = new Date( Date.UTC( 2026, 4, 4 ) );
		expect( formatWpDate( may, 'F j, Y', 'fr-FR' ) ).toBe( 'mai 4, 2026' );
	} );

	it( 'treats a backslash as a literal-escape', () => {
		// `\F` should emit a literal F, not the long-month token.
		expect( formatWpDate( APR_20_2026, '\\F=F', 'en-US' ) ).toBe( 'F=April' );
	} );

	it( 'leaves non-token characters in place', () => {
		expect( formatWpDate( APR_20_2026, '[Y]', 'en-US' ) ).toBe( '[2026]' );
	} );

	it( 'formats time tokens (H:i:s and g:i A)', () => {
		expect( formatWpDate( APR_20_2026, 'H:i:s', 'en-US' ) ).toBe( '10:30:45' );
		// 10:30 → 10:30 AM (12-hour clock without leading zero).
		expect( formatWpDate( APR_20_2026, 'g:i A', 'en-US' ) ).toBe( '10:30 AM' );
		// 22:30 → 10:30 PM.
		const evening = new Date( Date.UTC( 2026, 3, 20, 22, 30, 0 ) );
		expect( formatWpDate( evening, 'g:i a', 'en-US' ) ).toBe( '10:30 pm' );
	} );

	it( 'maps midnight and noon onto the 12-hour clock as 12, not 00', () => {
		// `h % 12 || 12` short-circuits the 0-hour case so midnight renders as
		// `12 AM` and noon as `12 PM`, matching PHP `date( 'h' )` / `date( 'g' )`.
		const midnight = new Date( Date.UTC( 2026, 3, 20, 0, 0, 0 ) );
		expect( formatWpDate( midnight, 'h:i A', 'en-US' ) ).toBe( '12:00 AM' );
		expect( formatWpDate( midnight, 'g:i a', 'en-US' ) ).toBe( '12:00 am' );

		const noon = new Date( Date.UTC( 2026, 3, 20, 12, 0, 0 ) );
		expect( formatWpDate( noon, 'h:i A', 'en-US' ) ).toBe( '12:00 PM' );
		expect( formatWpDate( noon, 'g:i a', 'en-US' ) ).toBe( '12:00 pm' );
	} );

	it( 'reads dates as UTC regardless of the runtime timezone', () => {
		// Forming the Date via Date.UTC pins the wall-clock to UTC; the
		// formatter must not shift it to the runtime's local offset.
		const utcNoon = new Date( Date.UTC( 2026, 11, 31, 12, 0, 0 ) );
		expect( formatWpDate( utcNoon, 'Y-m-d H:i', 'en-US' ) ).toBe( '2026-12-31 12:00' );
	} );

	it( 'computes the ISO year (o) across a year boundary', () => {
		// 2026-12-31 is a Thursday and falls in ISO week 53 of 2026.
		const dec31 = new Date( Date.UTC( 2026, 11, 31 ) );
		expect( formatWpDate( dec31, 'o', 'en-US' ) ).toBe( '2026' );
		// 2027-01-01 is a Friday and still falls in ISO week 53 of 2026.
		const jan1 = new Date( Date.UTC( 2027, 0, 1 ) );
		expect( formatWpDate( jan1, 'o', 'en-US' ) ).toBe( '2026' );
	} );

	it( 'leaves unrecognised letters in place', () => {
		// `Q` isn't a supported token — keep it visible rather than dropping it,
		// so authors see something is off rather than silently losing characters.
		expect( formatWpDate( APR_20_2026, 'Q', 'en-US' ) ).toBe( 'Q' );
	} );
} );
