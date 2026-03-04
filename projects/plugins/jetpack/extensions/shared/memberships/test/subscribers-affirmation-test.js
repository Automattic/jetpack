import { getFormattedCategories, getCopyForSubscribers } from '../subscribers-affirmation';

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
