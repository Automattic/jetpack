import reducer, { DEFAULT_STATE } from '../reducer';

describe( 'Membership products reducer testing', () => {
	test( 'we return the default state if we do not have a strategy for handling the supplied action.type.', () => {
		// Given
		const anyActionWithUnhandledType = {
			type: 'anyUnhandledType',
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, { action: anyActionWithUnhandledType } );

		// Then
		expect( returnedState ).toBe( DEFAULT_STATE );
	} );

	test( 'we return the provided state if we do not have a strategy for handling the supplied action.type.', () => {
		// Given
		const anyActionWithUnhandledType = {
			type: 'anyUnhandledType',
		};
		const anyNonDefaultState = { ...DEFAULT_STATE };
		anyNonDefaultState.connectUrl = 'anyConnectUrl';

		// When
		const returnedState = reducer( anyNonDefaultState, { action: anyActionWithUnhandledType } );

		// Then
		expect( returnedState ).toBe( anyNonDefaultState );
	} );

	test( 'set products action type adds the action products to the state.', () => {
		// Given
		const anyProductList = [ 'aProduct', 'anotherProduct' ];
		const anySetProductsAction = {
			type: 'SET_PRODUCTS',
			products: anyProductList,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anySetProductsAction );

		// Then
		expect( returnedState ).toStrictEqual( { ...DEFAULT_STATE, products: anyProductList } );
	} );

	test( 'set connect url action type adds the url to the state object.', () => {
		// Given
		const anyConnectUrl = 'anyUrl';
		const anySetConnectUrlAction = {
			type: 'SET_CONNECT_URL',
			connectUrl: anyConnectUrl,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anySetConnectUrlAction );

		// Then
		expect( returnedState ).toStrictEqual( { ...DEFAULT_STATE, connectUrl: anyConnectUrl } );
	} );

	test( 'set default connected account currency action type adds the currency to the state object.', () => {
		// Given
		const defaultCurrency = 'usd';
		const anySetConnectedAcccountDefaultCurrencyAction = {
			type: 'SET_CONNECTED_ACCOUNT_DEFAULT_CURRENCY',
			connectedAccountDefaultCurrency: defaultCurrency,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anySetConnectedAcccountDefaultCurrencyAction );

		// Then
		expect( returnedState ).toStrictEqual( {
			...DEFAULT_STATE,
			connectedAccountDefaultCurrency: defaultCurrency,
		} );
	} );

	test( 'set api state action type adds the api state to the returned state.', () => {
		// Given
		const anyApiState = 'anyApiState';
		const anySetApiStateAction = {
			type: 'SET_API_STATE',
			apiState: anyApiState,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anySetApiStateAction );

		// Then
		expect( returnedState ).toStrictEqual( { ...DEFAULT_STATE, apiState: anyApiState } );
	} );

	test( 'set site slug action type adds the update site property to the returned state.', () => {
		// Given
		const anySiteSlug = 'anySiteSlug';
		const anySetShouldUpgradeAction = {
			type: 'SET_SITE_SLUG',
			siteSlug: anySiteSlug,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anySetShouldUpgradeAction );

		// Then
		expect( returnedState ).toStrictEqual( { ...DEFAULT_STATE, siteSlug: anySiteSlug } );
	} );

	test( 'set newsletter categories action type adds the newsletter categories to the returned state.', () => {
		// Given
		const anyNewsletterCategories = {
			enabled: true,
			categories: [ { name: 'Any Category' } ],
		};
		const anySetNewsletterCategoriesAction = {
			type: 'SET_NEWSLETTER_CATEGORIES',
			newsletterCategories: anyNewsletterCategories,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anySetNewsletterCategoriesAction );

		// Then
		expect( returnedState ).toStrictEqual( {
			...DEFAULT_STATE,
			newsletterCategories: anyNewsletterCategories,
		} );
	} );

	test( 'SET_TOTAL_EMAILS_SENT_COUNT action adds the total emails sent count to the returned state.', () => {
		const anyTotalEmailsSentCount = 10;
		const anySetTotalEmailsSentCountAction = {
			type: 'SET_TOTAL_EMAILS_SENT_COUNT',
			totalEmailsSentCount: anyTotalEmailsSentCount,
		};

		const returnedState = reducer( DEFAULT_STATE, anySetTotalEmailsSentCountAction );

		expect( returnedState ).toStrictEqual( {
			...DEFAULT_STATE,
			totalEmailsSentCount: anyTotalEmailsSentCount,
		} );
	} );

	test( 'SET_POST_EMAIL_SENT_STATE stores payload under postEmailSentState for the given postId.', () => {
		const postId = 5;
		const payload = {
			email_sent_at: 1234567890,
			stats_on_send: { access_level: 'subscribers', post_categories: [ 1 ] },
		};
		const action = {
			type: 'SET_POST_EMAIL_SENT_STATE',
			postId,
			payload,
		};

		const returnedState = reducer( DEFAULT_STATE, action );

		expect( returnedState.postEmailSentState ).toStrictEqual( {
			[ postId ]: {
				email_sent_at: payload.email_sent_at,
				stats_on_send: payload.stats_on_send,
			},
		} );
	} );

	test( 'SET_POST_EMAIL_SENT_STATE preserves other postIds when adding a new one.', () => {
		const stateWithPost123 = {
			...DEFAULT_STATE,
			postEmailSentState: {
				123: { email_sent_at: 111, stats_on_send: null },
			},
		};
		const action = {
			type: 'SET_POST_EMAIL_SENT_STATE',
			postId: 456,
			payload: { email_sent_at: 222, stats_on_send: null },
		};

		const returnedState = reducer( stateWithPost123, action );

		expect( returnedState.postEmailSentState ).toStrictEqual( {
			123: { email_sent_at: 111, stats_on_send: null },
			456: { email_sent_at: 222, stats_on_send: null },
		} );
	} );

	test( 'SET_ALREADY_SENT_POST_MODIFIED_IN_SESSION stores true for the given postId.', () => {
		const postId = 10;
		const action = {
			type: 'SET_ALREADY_SENT_POST_MODIFIED_IN_SESSION',
			postId,
		};

		const returnedState = reducer( DEFAULT_STATE, action );

		expect( returnedState.alreadySentPostModifiedInSession ).toStrictEqual( {
			[ postId ]: true,
		} );
	} );

	test( 'SET_ALREADY_SENT_POST_MODIFIED_IN_SESSION preserves other postIds when adding a new one.', () => {
		const stateWithPost123 = {
			...DEFAULT_STATE,
			alreadySentPostModifiedInSession: {
				123: true,
			},
		};
		const action = {
			type: 'SET_ALREADY_SENT_POST_MODIFIED_IN_SESSION',
			postId: 456,
		};

		const returnedState = reducer( stateWithPost123, action );

		expect( returnedState.alreadySentPostModifiedInSession ).toStrictEqual( {
			123: true,
			456: true,
		} );
	} );

	test( 'SET_PUBLISHED_WITH_EMAIL_ENABLED_IN_SESSION stores true for the given postId.', () => {
		const postId = 10;
		const action = {
			type: 'SET_PUBLISHED_WITH_EMAIL_ENABLED_IN_SESSION',
			postId,
		};

		const returnedState = reducer( DEFAULT_STATE, action );

		expect( returnedState.publishedWithEmailEnabledInSession ).toStrictEqual( {
			[ postId ]: true,
		} );
	} );

	test( 'SET_PUBLISHED_WITH_EMAIL_ENABLED_IN_SESSION preserves other postIds when adding a new one.', () => {
		const stateWithPost123 = {
			...DEFAULT_STATE,
			publishedWithEmailEnabledInSession: {
				123: true,
			},
		};
		const action = {
			type: 'SET_PUBLISHED_WITH_EMAIL_ENABLED_IN_SESSION',
			postId: 456,
		};

		const returnedState = reducer( stateWithPost123, action );

		expect( returnedState.publishedWithEmailEnabledInSession ).toStrictEqual( {
			123: true,
			456: true,
		} );
	} );
} );
