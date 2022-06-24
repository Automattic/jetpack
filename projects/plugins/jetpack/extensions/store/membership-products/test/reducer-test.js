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

	test( 'set should upgrade action type adds the should upgrade property to the returned state.', () => {
		// Given
		const anyShouldUpgrade = 'anyUpgrade';
		const anySetShouldUpgradeAction = {
			type: 'SET_SHOULD_UPGRADE',
			shouldUpgrade: anyShouldUpgrade,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anySetShouldUpgradeAction );

		// Then
		expect( returnedState ).toStrictEqual( { ...DEFAULT_STATE, shouldUpgrade: anyShouldUpgrade } );
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

	test( 'set upgrade url action type adds the update site property to the returned state.', () => {
		// Given
		const anyUpgradeUrl = 'anyUpgradeUrl';
		const anyUpgradeUrlAction = {
			type: 'SET_UPGRADE_URL',
			upgradeUrl: anyUpgradeUrl,
		};

		// When
		const returnedState = reducer( DEFAULT_STATE, anyUpgradeUrlAction );

		// Then
		expect( returnedState ).toStrictEqual( { ...DEFAULT_STATE, upgradeUrl: anyUpgradeUrl } );
	} );
} );
