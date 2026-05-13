import {
	getNewsletterCategories,
	getNewsletterCategoriesEnabled,
	getNewsletterTierProducts,
	getPostEmailSentState,
	getProducts,
	getTotalEmailsSentCount,
	getAlreadySentPostModifiedInSession,
	getPublishedWithEmailEnabledInSession,
} from '../selectors';

describe( 'Membership Products Selectors', () => {
	test( 'GetProducts and getNewsletterTierProducts works as expected', () => {
		const products = [
			{
				id: 1,
				subscribe_as_site_subscriber: false,
			},
			{
				id: 2,
			},
		];
		const newsletter_product = {
			id: 3,
			subscribe_as_site_subscriber: true,
			type: 'tier',
		};

		const state = {
			products: [ ...products, newsletter_product ],
		};

		expect( getProducts( state ) ).toStrictEqual( state.products );
		expect( getNewsletterTierProducts( state ) ).toStrictEqual( [ newsletter_product ] );
	} );

	test( 'getNewsletterCategories and getNewsletterCategoriesEnabled works as expected', () => {
		const state = {
			newsletterCategories: {
				categories: [ 'category1', 'category2' ],
				enabled: true,
			},
		};

		expect( getNewsletterCategories( state ) ).toStrictEqual(
			state.newsletterCategories.categories
		);
		expect( getNewsletterCategoriesEnabled( state ) ).toStrictEqual(
			state.newsletterCategories.enabled
		);
	} );

	test( 'getTotalEmailsSentCount works as expected', () => {
		const state = {
			totalEmailsSentCount: 100,
		};

		expect( getTotalEmailsSentCount( state ) ).toStrictEqual( state.totalEmailsSentCount );
	} );

	test( 'getPostEmailSentState returns post-specific state when present', () => {
		const state = {
			postEmailSentState: {
				5: {
					email_sent_at: 1234567890,
					stats_on_send: { access_level: 'subscribers' },
				},
			},
		};

		expect( getPostEmailSentState( state, 5 ) ).toStrictEqual( {
			email_sent_at: 1234567890,
			stats_on_send: { access_level: 'subscribers' },
		} );
	} );

	test( 'getPostEmailSentState returns default when postId is missing or falsy', () => {
		const state = {
			postEmailSentState: {
				5: { email_sent_at: 123, stats_on_send: null },
			},
		};
		const defaultValue = { email_sent_at: null, stats_on_send: null };

		expect( getPostEmailSentState( state, null ) ).toStrictEqual( defaultValue );
		expect( getPostEmailSentState( state, undefined ) ).toStrictEqual( defaultValue );
		expect( getPostEmailSentState( state, 0 ) ).toStrictEqual( defaultValue );
	} );

	test( 'getPostEmailSentState returns default when postId is not in state', () => {
		const state = {
			postEmailSentState: {
				5: { email_sent_at: 123, stats_on_send: null },
			},
		};

		expect( getPostEmailSentState( state, 99 ) ).toStrictEqual( {
			email_sent_at: null,
			stats_on_send: null,
		} );
	} );

	test( 'getAlreadySentPostModifiedInSession returns true when postId is in state', () => {
		const state = {
			alreadySentPostModifiedInSession: { 5: true },
		};

		expect( getAlreadySentPostModifiedInSession( state, 5 ) ).toBe( true );
	} );

	test( 'getAlreadySentPostModifiedInSession returns false when postId is not in state', () => {
		const state = {
			alreadySentPostModifiedInSession: {},
		};

		expect( getAlreadySentPostModifiedInSession( state, 5 ) ).toBe( false );
		expect(
			getAlreadySentPostModifiedInSession( { alreadySentPostModifiedInSession: { 10: true } }, 5 )
		).toBe( false );
	} );

	test( 'getPublishedWithEmailEnabledInSession returns true when postId is in state', () => {
		const state = {
			publishedWithEmailEnabledInSession: { 5: true },
		};

		expect( getPublishedWithEmailEnabledInSession( state, 5 ) ).toBe( true );
	} );

	test( 'getPublishedWithEmailEnabledInSession returns false when postId is not in state', () => {
		const state = {
			publishedWithEmailEnabledInSession: {},
		};

		expect( getPublishedWithEmailEnabledInSession( state, 5 ) ).toBe( false );
		expect(
			getPublishedWithEmailEnabledInSession(
				{ publishedWithEmailEnabledInSession: { 10: true } },
				5
			)
		).toBe( false );
	} );
} );
