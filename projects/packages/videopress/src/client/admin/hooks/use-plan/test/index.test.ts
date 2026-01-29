/**
 * Test for usePlan hook's hasVideoPressPurchase logic.
 *
 * Since the hook reads from window.jetpackVideoPressInitialState at module load time,
 * we use jest.isolateModules() to get fresh module instances with different window state.
 */

declare global {
	interface Window {
		jetpackVideoPressInitialState?: {
			paidFeatures?: {
				isVideoPressSupported?: boolean;
				isVideoPress1TBSupported?: boolean;
				isVideoPressUnlimitedSupported?: boolean;
			};
			siteProductData?: object;
			productData?: object;
			productPrice?: object;
		};
	}
}

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

// Mock the state store
jest.mock( '../../../../state', () => ( {
	STORE_ID: 'jetpack-videopress',
} ) );

/**
 * Helper to import usePlan in an isolated module context.
 * This ensures each test gets a fresh module that reads the current window state.
 *
 * @return {object} The result of calling usePlan()
 */
function importUsePlan(): { hasVideoPressPurchase: boolean } {
	let result: { hasVideoPressPurchase: boolean } = { hasVideoPressPurchase: false };
	jest.isolateModules( () => {
		const { usePlan } = jest.requireActual< typeof import('..') >( '..' );
		result = usePlan();
	} );
	return result;
}

describe( 'usePlan hasVideoPressPurchase logic', () => {
	afterEach( () => {
		delete window.jetpackVideoPressInitialState;
	} );

	it( 'returns true when isVideoPress1TBSupported is true (paid VideoPress plan)', () => {
		window.jetpackVideoPressInitialState = {
			paidFeatures: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: false,
			},
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( true );
	} );

	it( 'returns false when isVideoPress1TBSupported is false (free tier)', () => {
		window.jetpackVideoPressInitialState = {
			paidFeatures: {
				isVideoPressSupported: true, // This is always true, even for free tier
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: false,
			},
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns false when paidFeatures is undefined', () => {
		window.jetpackVideoPressInitialState = {
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns false when jetpackVideoPressInitialState is undefined', () => {
		// Don't set window.jetpackVideoPressInitialState at all
		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns true when isVideoPressUnlimitedSupported is true (Complete plan has both)', () => {
		// Complete plans have both 1TB and unlimited features
		window.jetpackVideoPressInitialState = {
			paidFeatures: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: true,
			},
			siteProductData: {},
			productData: {},
			productPrice: {},
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( true );
	} );
} );
