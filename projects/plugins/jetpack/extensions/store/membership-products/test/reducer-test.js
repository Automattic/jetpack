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

	test( 'set newsletter categories subscriptions count action type adds the newsletter categories subscriptions count to the returned state.', () => {
		// Given
		const anyNewsletterCategoriesSubscriptionsCount = 1;
		const anySetNewsletterCategoriesSubscriptionsCountAction = {
			type: 'SET_NEWSLETTER_CATEGORIES_SUBSCRIPTIONS_COUNT',
			newsletterCategoriesSubscriptionsCount: anyNewsletterCategoriesSubscriptionsCount,
		};

		// When
		const returnedState = reducer(
			DEFAULT_STATE,
			anySetNewsletterCategoriesSubscriptionsCountAction
		);

		// Then
		expect( returnedState ).toStrictEqual( {
			...DEFAULT_STATE,
			newsletterCategoriesSubscriptionsCount: anyNewsletterCategoriesSubscriptionsCount,
		} );
	} );
} );
