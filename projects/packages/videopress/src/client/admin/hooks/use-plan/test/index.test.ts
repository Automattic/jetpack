/**
 * Test for usePlan hook's hasVideoPressPurchase logic.
 *
 * Since the hook reads from window.jetpackVideoPressInitialState at module load time,
 * we test the logic by mocking the entire hook module for consumers.
 */

// Mock the state store
jest.mock( '../../../../state', () => ( {
	STORE_ID: 'jetpack-videopress',
} ) );

// Mock @wordpress/data
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn( () => ( {
		purchases: [],
		isFetchingPurchases: false,
	} ) ),
	combineReducers: jest.fn( reducers => reducers ),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

describe( 'usePlan hasVideoPressPurchase logic', () => {
	beforeEach( () => {
		jest.resetModules();
	} );

	afterEach( () => {
		delete ( window as any ).jetpackVideoPressInitialState;
	} );

	it( 'returns true when isVideoPress1TBSupported is true (paid VideoPress plan)', () => {
		( window as any ).jetpackVideoPressInitialState = {
			paidFeatures: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: false,
			},
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const { usePlan } = require( '..' );
		const result = usePlan();

		expect( result.hasVideoPressPurchase ).toBe( true );
	} );

	it( 'returns false when isVideoPress1TBSupported is false (free tier)', () => {
		( window as any ).jetpackVideoPressInitialState = {
			paidFeatures: {
				isVideoPressSupported: true, // This is always true, even for free tier
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: false,
			},
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const { usePlan } = require( '..' );
		const result = usePlan();

		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns false when paidFeatures is undefined', () => {
		( window as any ).jetpackVideoPressInitialState = {
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const { usePlan } = require( '..' );
		const result = usePlan();

		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns false when jetpackVideoPressInitialState is undefined', () => {
		// Don't set window.jetpackVideoPressInitialState at all

		const { usePlan } = require( '..' );
		const result = usePlan();

		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns true when isVideoPressUnlimitedSupported is true (Complete plan has both)', () => {
		// Complete plans have both 1TB and unlimited features
		( window as any ).jetpackVideoPressInitialState = {
			paidFeatures: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: true,
			},
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const { usePlan } = require( '..' );
		const result = usePlan();

		expect( result.hasVideoPressPurchase ).toBe( true );
	} );
} );
