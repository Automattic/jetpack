import {
	getFormattedCategories,
	formatSentDate,
	getCopyForSubscribers,
} from '../subscribers-affirmation';

jest.mock( '@wordpress/date', () => ( {
	dateI18n: jest.fn( ( format, date ) => ( date ? '2024-03-15' : '' ) ),
	getDate: jest.fn( str => {
		if ( ! str ) return new Date( 0 );
		const d = new Date( str.replace( ' ', 'T' ) );
		return isNaN( d.getTime() ) ? null : d;
	} ),
	getSettings: jest.fn( () => ( {
		formats: { date: 'F j, Y' },
		l10n: { startOfWeek: 0 },
		timezone: { offset: 0, string: '' },
	} ) ),
} ) );

describe( 'getFormattedCategories', () => {
	const newsletterCategories = [
		{ id: 1, name: 'Uncategorized' },
		{ id: 2, name: 'Tech' },
		{ id: 3, name: 'News' },
	];

	test( 'returns empty string when fallbackToUncategorized is false and postCategories is empty', () => {
		expect( getFormattedCategories( [], newsletterCategories, false ) ).toBe( '' );
		expect( getFormattedCategories( null, newsletterCategories, false ) ).toBe( '' );
		expect( getFormattedCategories( undefined, newsletterCategories, false ) ).toBe( '' );
	} );

	test( 'returns Uncategorized when fallbackToUncategorized is true and postCategories is empty', () => {
		const result = getFormattedCategories( [], newsletterCategories, true );
		expect( result ).toContain( 'Uncategorized' );
		expect( result ).toContain( '<strong>' );
	} );

	test( 'single category returns strong-wrapped name', () => {
		const result = getFormattedCategories( [ 2 ], newsletterCategories );
		expect( result ).toBe( '<strong>Tech</strong>' );
	} );

	test( 'two categories returns "X and Y"', () => {
		const result = getFormattedCategories( [ 2, 3 ], newsletterCategories );
		expect( result ).toContain( '<strong>Tech</strong>' );
		expect( result ).toContain( '<strong>News</strong>' );
		expect( result ).toMatch( /and/ );
	} );

	test( 'three or more categories returns "X, Y, and Z" style', () => {
		const result = getFormattedCategories( [ 1, 2, 3 ], newsletterCategories );
		expect( result ).toContain( ',' );
		expect( result ).toMatch( /and/ );
	} );

	test( 'appends "All content" when post has non-newsletter category', () => {
		const result = getFormattedCategories( [ 2, 99 ], newsletterCategories );
		expect( result ).toContain( 'All content' );
		expect( result ).toContain( 'Tech' );
	} );

	test( 'uses stats newsletter_categories when provided as second arg', () => {
		const statsCategories = [ { id: 2, name: 'Tech (at send time)' } ];
		const result = getFormattedCategories( [ 2 ], statsCategories, false );
		expect( result ).toBe( '<strong>Tech (at send time)</strong>' );
	} );

	test( 'handles undefined postCategories with optional chaining when fallback is false', () => {
		expect( getFormattedCategories( undefined, newsletterCategories, false ) ).toBe( '' );
	} );
} );

describe( 'formatSentDate', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		const { getDate, getSettings, dateI18n } = require( '@wordpress/date' );
		getDate.mockImplementation( str => {
			if ( ! str ) return new Date( 0 );
			const d = new Date( str.replace( ' ', 'T' ) );
			return isNaN( d.getTime() ) ? null : d;
		} );
		getSettings.mockReturnValue( { formats: { date: 'F j, Y' } } );
		dateI18n.mockReturnValue( '2024-03-15' );
	} );

	test( 'returns formatted date for valid emailSentAt (Unix seconds)', () => {
		const result = formatSentDate( 1710460800, null );
		expect( result ).toBe( '2024-03-15' );
	} );

	test( 'returns formatted date for statsTimestamp (MySQL string) via getDate', () => {
		const { getDate } = require( '@wordpress/date' );
		const result = formatSentDate( null, '2024-03-15 12:00:00' );
		expect( getDate ).toHaveBeenCalledWith( '2024-03-15 12:00:00' );
		expect( result ).toBe( '2024-03-15' );
	} );

	test( 'returns empty string when both inputs are null/empty', () => {
		expect( formatSentDate( null, null ) ).toBe( '' );
		expect( formatSentDate( null, '' ) ).toBe( '' );
	} );

	test( 'returns empty string for invalid date', () => {
		const { getDate } = require( '@wordpress/date' );
		getDate.mockReturnValue( new Date( 'invalid' ) );
		const result = formatSentDate( null, 'invalid-date' );
		expect( result ).toBe( '' );
	} );
} );

describe( 'getCopyForSubscribers', () => {
	test( 'future tense returns "will be sent" copy', () => {
		const result = getCopyForSubscribers( {
			futureTense: true,
			isPaidPost: false,
			postHasPaywallBlock: false,
			reachCount: 5,
		} );
		expect( result ).toContain( 'will be sent' );
		expect( result ).toContain( '5' );
	} );

	test( 'past tense returns "was sent" copy', () => {
		const result = getCopyForSubscribers( {
			futureTense: false,
			isPaidPost: false,
			postHasPaywallBlock: false,
			reachCount: 10,
		} );
		expect( result ).toContain( 'was sent' );
		expect( result ).toContain( '10' );
	} );

	test( 'paid post without paywall shows paid subscriber copy', () => {
		const result = getCopyForSubscribers( {
			futureTense: true,
			isPaidPost: true,
			postHasPaywallBlock: false,
			reachCount: 3,
		} );
		expect( result ).toContain( 'paid subscriber' );
	} );

	test( 'pluralizes subscriber correctly', () => {
		const singular = getCopyForSubscribers( {
			futureTense: true,
			isPaidPost: false,
			postHasPaywallBlock: false,
			reachCount: 1,
		} );
		const plural = getCopyForSubscribers( {
			futureTense: true,
			isPaidPost: false,
			postHasPaywallBlock: false,
			reachCount: 2,
		} );
		expect( singular ).toContain( 'subscriber' );
		expect( singular ).not.toContain( 'subscribers' );
		expect( plural ).toContain( 'subscribers' );
	} );
} );
