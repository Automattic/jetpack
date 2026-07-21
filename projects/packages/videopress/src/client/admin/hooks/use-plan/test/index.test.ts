/**
 * Test for usePlan hook's hasVideoPressPurchase logic.
 *
 * The hook now fetches features dynamically from the Redux store via useSelect.
 */

// Type-only import of the Window augmentation; keeps this file a module so `require` stays block-scoped.
import type {} from '../../../components/admin-page/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: ( id: string ) => any;

// Store the mock features data that tests will set
let mockFeaturesData: {
	features?: {
		isVideoPressSupported?: boolean;
		isVideoPress1TBSupported?: boolean;
		isVideoPressUnlimitedSupported?: boolean;
	};
	isFetchingFeatures: boolean;
} = {
	features: undefined,
	isFetchingFeatures: false,
};

// Mock @wordpress/data
jest.mock( '@wordpress/data', () => ( {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	useSelect: jest.fn( ( _selectorCallback: ( select: () => object ) => object ) => {
		// Return the mock data directly since we're mocking the entire flow
		return mockFeaturesData;
	} ),
	combineReducers: jest.fn( reducers => reducers ),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

// Mock the state store
jest.mock( '../../../../state', () => ( {
	STORE_ID: 'jetpack-videopress',
} ) );

// Mock mapObjectKeysToCamel
jest.mock( '../../../../utils/map-object-keys-to-camel-case', () => ( {
	mapObjectKeysToCamel: jest.fn( obj => obj || {} ),
} ) );

/**
 * Helper to import usePlan in an isolated module context.
 * This ensures each test gets a fresh module that reads the current window state.
 *
 * @return {object} The result of calling usePlan()
 */
function importUsePlan(): { hasVideoPressPurchase: boolean; isFetchingFeatures: boolean } {
	let result: { hasVideoPressPurchase: boolean; isFetchingFeatures: boolean } = {
		hasVideoPressPurchase: false,
		isFetchingFeatures: false,
	};
	jest.isolateModules( () => {
		const { usePlan } = require( '..' );
		result = usePlan();
	} );
	return result;
}

describe( 'usePlan hasVideoPressPurchase logic', () => {
	beforeEach( () => {
		jest.resetModules();
		window.jetpackVideoPressInitialState = {
			siteProductData: {},
			productData: {},
			productPrice: {},
		} as unknown as Window[ 'jetpackVideoPressInitialState' ];
		mockFeaturesData = {
			features: undefined,
			isFetchingFeatures: false,
		};
	} );

	afterEach( () => {
		delete window.jetpackVideoPressInitialState;
	} );

	it( 'returns true when isVideoPress1TBSupported is true (paid VideoPress plan)', () => {
		mockFeaturesData = {
			features: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: false,
			},
			isFetchingFeatures: false,
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( true );
	} );

	it( 'returns false when isVideoPress1TBSupported is false (free tier)', () => {
		mockFeaturesData = {
			features: {
				isVideoPressSupported: true, // This is always true, even for free tier
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: false,
			},
			isFetchingFeatures: false,
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns false when features is undefined', () => {
		mockFeaturesData = {
			features: undefined,
			isFetchingFeatures: false,
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( false );
	} );

	it( 'returns true when isVideoPressUnlimitedSupported is true (Complete plan has both)', () => {
		// Complete plans have both 1TB and unlimited features
		mockFeaturesData = {
			features: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: true,
			},
			isFetchingFeatures: false,
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( true );
	} );

	it( 'returns true when only isVideoPressUnlimitedSupported is true (legacy Security Daily)', () => {
		mockFeaturesData = {
			features: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: false,
				isVideoPressUnlimitedSupported: true,
			},
			isFetchingFeatures: false,
		};

		const result = importUsePlan();
		expect( result.hasVideoPressPurchase ).toBe( true );
	} );

	it( 'returns isFetchingFeatures state from store', () => {
		mockFeaturesData = {
			features: undefined,
			isFetchingFeatures: true,
		};

		const result = importUsePlan();
		expect( result.isFetchingFeatures ).toBe( true );
	} );

	it( 'falls back to static paidFeatures when dynamic features are undefined', () => {
		// Set static paidFeatures in initial state
		window.jetpackVideoPressInitialState = {
			siteProductData: {},
			productData: {},
			productPrice: {},
			paidFeatures: {
				isVideoPressSupported: true,
				isVideoPress1TBSupported: true,
				isVideoPressUnlimitedSupported: false,
			},
		} as unknown as Window[ 'jetpackVideoPressInitialState' ];

		// Dynamic features not yet loaded
		mockFeaturesData = {
			features: undefined,
			isFetchingFeatures: true,
		};

		const result = importUsePlan();
		// Should use static paidFeatures as fallback
		expect( result.hasVideoPressPurchase ).toBe( true );
	} );
} );
