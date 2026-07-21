import { getAdminUrl } from '@automattic/jetpack-script-data';
import { META_NAME_FOR_POST_TIER_ID_SETTINGS, accessOptions } from '../constants';
import {
	getFormattedCategories,
	getAccessLevelLabel,
	getAccessLabelForCopy,
	getCurrentTierName,
	shouldShowWontResendMessage,
	getSentCopyLine,
	getJetpackEmailStatsLink,
	getSiteVisibilitySettingsLink,
} from '../subscribers-affirmation';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: jest.fn( path => `https://admin.example.com/${ path }` ),
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

describe( 'getAccessLevelLabel', () => {
	test( 'empty or falsy accessLevel returns "all subscribers"', () => {
		expect( getAccessLevelLabel( '' ) ).toBe( 'all subscribers' );
		expect( getAccessLevelLabel( null ) ).toBe( 'all subscribers' );
		expect( getAccessLevelLabel( undefined ) ).toBe( 'all subscribers' );
	} );

	test( 'everybody and subscribers return "all subscribers"', () => {
		expect( getAccessLevelLabel( 'everybody' ) ).toBe( 'all subscribers' );
		expect( getAccessLevelLabel( 'subscribers' ) ).toBe( 'all subscribers' );
	} );

	test( 'unknown accessLevel defaults to "all subscribers"', () => {
		expect( getAccessLevelLabel( 'unknown' ) ).toBe( 'all subscribers' );
	} );

	test( 'paid_subscribers returns "paid subscribers"', () => {
		expect( getAccessLevelLabel( 'paid_subscribers' ) ).toBe( 'paid subscribers' );
	} );

	test( 'paid_subscribers with tierName returns "paid subscribers (Premium)"', () => {
		expect( getAccessLevelLabel( 'paid_subscribers', 'Premium' ) ).toBe(
			'paid subscribers (Premium)'
		);
	} );
} );

describe( 'getAccessLabelForCopy', () => {
	test( 'paid_subscribers with paywall returns "all subscribers"', () => {
		expect( getAccessLabelForCopy( 'paid_subscribers', null, true ) ).toBe( 'all subscribers' );
	} );

	test( 'paid_subscribers with paywall ignores tierName', () => {
		expect( getAccessLabelForCopy( 'paid_subscribers', 'Premium', true ) ).toBe(
			'all subscribers'
		);
	} );

	test( 'paid_subscribers without paywall returns "paid subscribers"', () => {
		expect( getAccessLabelForCopy( 'paid_subscribers', null, false ) ).toBe( 'paid subscribers' );
	} );

	test( 'paid_subscribers without paywall with tierName returns "paid subscribers (Premium)"', () => {
		expect( getAccessLabelForCopy( 'paid_subscribers', 'Premium', false ) ).toBe(
			'paid subscribers (Premium)'
		);
	} );

	test( 'subscribers with paywall returns "all subscribers"', () => {
		expect( getAccessLabelForCopy( 'subscribers', null, true ) ).toBe( 'all subscribers' );
	} );

	test( 'paid_subscribers with falsy postHasPaywallBlock defaults to paid label', () => {
		expect( getAccessLabelForCopy( 'paid_subscribers', null, undefined ) ).toBe(
			'paid subscribers'
		);
		expect( getAccessLabelForCopy( 'paid_subscribers', null ) ).toBe( 'paid subscribers' );
	} );

	test( 'paid_subscribers with has_paywall_block null (legacy stats) returns "paid subscribers"', () => {
		expect( getAccessLabelForCopy( 'paid_subscribers', null, null ) ).toBe( 'paid subscribers' );
	} );
} );

describe( 'getCurrentTierName', () => {
	test( 'accessLevel not paid_subscribers returns null', () => {
		expect(
			getCurrentTierName( 'subscribers', { [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: 1 }, [] )
		).toBeNull();
	} );

	test( 'paid_subscribers but no tierId in postMeta returns null', () => {
		expect(
			getCurrentTierName( accessOptions.paid_subscribers.key, {}, [ { id: 1, title: 'Premium' } ] )
		).toBeNull();
	} );

	test( 'paid_subscribers with tierId and matching product returns product title', () => {
		const tierProducts = [ { id: 1, title: 'Premium' } ];
		expect(
			getCurrentTierName(
				accessOptions.paid_subscribers.key,
				{ [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: 1 },
				tierProducts
			)
		).toBe( 'Premium' );
	} );

	test( 'paid_subscribers with tierId but no matching product returns null', () => {
		const tierProducts = [ { id: 2, title: 'Basic' } ];
		expect(
			getCurrentTierName(
				accessOptions.paid_subscribers.key,
				{ [ META_NAME_FOR_POST_TIER_ID_SETTINGS ]: 1 },
				tierProducts
			)
		).toBeNull();
	} );
} );

describe( 'shouldShowWontResendMessage', () => {
	test( 'alreadySentPostModifiedInSession true returns true', () => {
		expect(
			shouldShowWontResendMessage( {
				statsOnSend: { access_level: 'subscribers' },
				postMeta: {},
				accessLevel: 'subscribers',
				tierProducts: [],
				postCategories: [],
				alreadySentPostModifiedInSession: true,
				prePublish: false,
			} )
		).toBe( true );
	} );

	test( 'prePublish true returns true', () => {
		expect(
			shouldShowWontResendMessage( {
				statsOnSend: { access_level: 'subscribers' },
				postMeta: {},
				accessLevel: 'subscribers',
				tierProducts: [],
				postCategories: [],
				alreadySentPostModifiedInSession: false,
				prePublish: true,
			} )
		).toBe( true );
	} );

	test( 'accessMatches and categoriesMatch returns false', () => {
		expect(
			shouldShowWontResendMessage( {
				statsOnSend: {
					access_level: 'subscribers',
					paid_tier: null,
					post_categories: [ 1, 2 ],
					has_newsletter_categories: true,
				},
				postMeta: {},
				accessLevel: 'subscribers',
				tierProducts: [],
				postCategories: [ 1, 2 ],
				alreadySentPostModifiedInSession: false,
				prePublish: false,
			} )
		).toBe( false );
	} );

	test( 'accessLevel mismatch returns true', () => {
		expect(
			shouldShowWontResendMessage( {
				statsOnSend: { access_level: 'paid_subscribers', paid_tier: null },
				postMeta: {},
				accessLevel: 'subscribers',
				tierProducts: [],
				postCategories: [],
				alreadySentPostModifiedInSession: false,
				prePublish: false,
			} )
		).toBe( true );
	} );

	test( 'categories mismatch returns true', () => {
		expect(
			shouldShowWontResendMessage( {
				statsOnSend: {
					access_level: 'subscribers',
					post_categories: [ 1, 2 ],
					has_newsletter_categories: true,
				},
				postMeta: {},
				accessLevel: 'subscribers',
				tierProducts: [],
				postCategories: [ 1 ],
				alreadySentPostModifiedInSession: false,
				prePublish: false,
			} )
		).toBe( true );
	} );
} );

describe( 'getSentCopyLine', () => {
	test( 'tense past with dateStr and no accessLabel returns date-only format', () => {
		const result = getSentCopyLine( {
			accessLabel: '',
			categoryNames: '',
			tense: 'past',
			dateStr: 'Jan 15, 2024',
		} );
		expect( result ).toContain( 'emailed on' );
		expect( result ).toContain( 'Jan 15, 2024' );
		expect( result ).toContain( 'delivery details' );
	} );

	test( 'tense past with categoryNames and dateStr returns "was emailed to X of Y on Z"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: 'Tech',
			tense: 'past',
			dateStr: 'Jan 15, 2024',
		} );
		expect( result ).toContain( 'was emailed to' );
		expect( result ).toContain( 'all subscribers' );
		expect( result ).toContain( 'Tech' );
		expect( result ).toContain( 'Jan 15, 2024' );
	} );

	test( 'tense past with categoryNames, no dateStr returns "was emailed to X of Y"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: 'Tech',
			tense: 'past',
			dateStr: '',
		} );
		expect( result ).toContain( 'was emailed to' );
		expect( result ).toContain( 'all subscribers' );
		expect( result ).toContain( 'Tech' );
	} );

	test( 'tense present with categoryNames returns "is being emailed to X of Y"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: 'Tech',
			tense: 'present',
			dateStr: '',
		} );
		expect( result ).toContain( 'is being emailed' );
		expect( result ).toContain( 'all subscribers' );
		expect( result ).toContain( 'Tech' );
	} );

	test( 'tense future with categoryNames returns "will be emailed to X of Y"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: 'Tech',
			tense: 'future',
			dateStr: '',
		} );
		expect( result ).toContain( 'will be emailed' );
		expect( result ).toContain( 'all subscribers' );
		expect( result ).toContain( 'Tech' );
	} );

	test( 'tense past with accessLabel and dateStr returns "was emailed to X on Y"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: '',
			tense: 'past',
			dateStr: 'Jan 15, 2024',
		} );
		expect( result ).toContain( 'was emailed to' );
		expect( result ).toContain( 'all subscribers' );
		expect( result ).toContain( 'Jan 15, 2024' );
	} );

	test( 'tense past with accessLabel only returns "was emailed to X"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: '',
			tense: 'past',
			dateStr: '',
		} );
		expect( result ).toContain( 'was emailed to' );
		expect( result ).toContain( 'all subscribers' );
		expect( result ).toContain( 'delivery details' );
	} );

	test( 'tense present with accessLabel returns "is being emailed to X"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: '',
			tense: 'present',
			dateStr: '',
		} );
		expect( result ).toContain( 'is being emailed' );
		expect( result ).toContain( 'all subscribers' );
	} );

	test( 'tense future with accessLabel returns "will be emailed to X"', () => {
		const result = getSentCopyLine( {
			accessLabel: 'all subscribers',
			categoryNames: '',
			tense: 'future',
			dateStr: '',
		} );
		expect( result ).toContain( 'will be emailed' );
		expect( result ).toContain( 'all subscribers' );
	} );
} );

describe( 'getJetpackEmailStatsLink', () => {
	beforeEach( () => {
		getAdminUrl.mockClear();
	} );

	test( 'calls getAdminUrl with correct path and returns result', () => {
		const result = getJetpackEmailStatsLink( 123, 456 );

		expect( getAdminUrl ).toHaveBeenCalledWith(
			'admin.php?page=stats#!/stats/email/opens/day/456/123'
		);
		expect( result ).toBe(
			'https://admin.example.com/admin.php?page=stats#!/stats/email/opens/day/456/123'
		);
	} );
} );

describe( 'getSiteVisibilitySettingsLink', () => {
	beforeEach( () => {
		getAdminUrl.mockClear();
	} );

	test( 'links to the Reading settings page where site visibility is changed', () => {
		const result = getSiteVisibilitySettingsLink();

		expect( getAdminUrl ).toHaveBeenCalledWith( 'options-reading.php' );
		expect( result ).toBe( 'https://admin.example.com/options-reading.php' );
	} );
} );
