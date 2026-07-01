/*
 * Behavior tests for the cookie-consent interactivity view.
 *
 * Focused on the geo-provider error handling that the config-layer tests in utils.test.ts
 * cannot reach: the `showOnError` branch in initializeGeolocation and the null-countryCode
 * short-circuit in updateContextFromGeolocation.
 *
 * @jest-environment-options {"url": "https://shop.example.co.uk/"}
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UNKNOWN_COUNTRY_CODE, type GeoConfig } from '../src/modules/cookie-consent/utils';

// Mock the WordPress Interactivity API so we can capture the store definition and stub the
// per-request config/context the view reads at runtime.
const mockStore = jest.fn();
const mockGetContext = jest.fn();
const mockGetConfig = jest.fn();
const mockWithSyncEvent = jest.fn( ( callback: unknown ) => callback );

await jest.unstable_mockModule( '@wordpress/interactivity', () => ( {
	store: mockStore,
	getContext: mockGetContext,
	getConfig: mockGetConfig,
	withSyncEvent: mockWithSyncEvent,
} ) );

interface StoreConfig {
	geo: GeoConfig;
	cookiePolicyUrl: string;
	gdprHonorsGpc: boolean;
	forcePreview: boolean;
	geoEnabled?: boolean;
}

type Action = ( ...args: unknown[] ) => Generator< unknown, unknown, unknown >;

let storeActions: Record< string, Action >;
let cookieWrites: string[];
let cookieJar: string;
let fetchMock: jest.Mock< typeof fetch >;

const DEFAULT_GEO: GeoConfig = {
	provider: 'wpcom',
	apiUrl: 'https://public-api.wordpress.com/geo/',
	countryCodeCookie: 'country_code',
	regionCookie: 'region',
	cookieDuration: 6 * 60 * 60,
	gdprCountries: [ 'FR' ],
	ccpaRegions: [ 'california' ],
	showOnError: true,
};

const makeConfig = ( geo: Partial< GeoConfig > = {} ): StoreConfig => ( {
	geo: { ...DEFAULT_GEO, ...geo },
	cookiePolicyUrl: 'https://automattic.com/cookies/',
	gdprHonorsGpc: true,
	forcePreview: false,
} );

const isGenerator = ( value: unknown ): value is Generator< unknown, unknown, unknown > =>
	value !== null &&
	typeof value === 'object' &&
	typeof ( value as { next?: unknown } ).next === 'function' &&
	typeof ( value as { throw?: unknown } ).throw === 'function';

/**
 * Drive a generator-based action the way the interactivity runtime would: await each yielded
 * promise (and recurse into yielded child actions), forwarding rejections back into the
 * generator so its own try/catch handles them.
 *
 * @param {Generator} generator - The generator returned by invoking a store action.
 * @return {Promise<unknown>} The generator's return value.
 */
async function runAction( generator: Generator< unknown, unknown, unknown > ): Promise< unknown > {
	let step = generator.next();
	while ( ! step.done ) {
		try {
			const yielded = step.value;
			const resolved = isGenerator( yielded ) ? await runAction( yielded ) : await yielded;
			step = generator.next( resolved );
		} catch ( error ) {
			step = generator.throw( error );
		}
	}
	return step.value;
}

beforeEach( async () => {
	// Re-import per test so the module-level geoState singleton starts uninitialized.
	jest.resetModules();

	cookieWrites = [];
	cookieJar = '';
	Object.defineProperty( document, 'cookie', {
		configurable: true,
		get: () => cookieJar,
		set: ( value: string ) => {
			cookieWrites.push( value );
		},
	} );

	// jsdom provides no global fetch to spy on, so install a fresh mock directly each test.
	fetchMock = jest.fn< typeof fetch >();
	global.fetch = fetchMock;

	mockGetContext.mockReturnValue( {} );
	mockStore.mockImplementation(
		( _namespace: string, config: { actions: Record< string, Action > } ) => {
			storeActions = config.actions;
			return config;
		}
	);

	await import( '../src/modules/cookie-consent/view' );
} );

describe( 'initializeGeolocation geo-provider error handling', () => {
	it( 'suppresses geo state and writes no fallback cookie when showOnError is false and the fetch fails', async () => {
		mockGetConfig.mockReturnValue( makeConfig( { showOnError: false } ) );
		fetchMock.mockRejectedValue( new Error( 'network down' ) );

		const result = await runAction( storeActions.initializeGeolocation() );

		expect( result ).toEqual( { initialized: true, countryCode: null, region: null } );
		expect( cookieWrites ).toHaveLength( 0 );
		expect( console ).toHaveWarned();
	} );

	it( 'falls back to UNKNOWN and caches a country cookie when showOnError is true and the fetch fails', async () => {
		mockGetConfig.mockReturnValue( makeConfig( { showOnError: true } ) );
		fetchMock.mockRejectedValue( new Error( 'network down' ) );

		const result = await runAction( storeActions.initializeGeolocation() );

		expect( result ).toMatchObject( { initialized: true, countryCode: UNKNOWN_COUNTRY_CODE } );
		expect(
			cookieWrites.some( write => write.includes( `country_code=${ UNKNOWN_COUNTRY_CODE }` ) )
		).toBe( true );
		expect( console ).toHaveWarned();
	} );

	it( 'fails closed without fetching when a custom provider has no apiUrl and showOnError is false', async () => {
		mockGetConfig.mockReturnValue(
			makeConfig( { provider: 'custom', apiUrl: '', showOnError: false } )
		);
		const result = await runAction( storeActions.initializeGeolocation() );

		expect( result ).toEqual( { initialized: true, countryCode: null, region: null } );
		expect( fetchMock ).not.toHaveBeenCalled();
		expect( cookieWrites ).toHaveLength( 0 );
		expect( console ).toHaveWarned();
	} );

	it( 'resolves and caches country/region cookies on a successful lookup', async () => {
		mockGetConfig.mockReturnValue( makeConfig() );
		fetchMock.mockResolvedValue( {
			ok: true,
			json: async () => ( { country_short: 'FR', region: 'Brittany' } ),
		} as unknown as Response );

		const result = await runAction( storeActions.initializeGeolocation() );

		expect( result ).toMatchObject( { initialized: true, countryCode: 'FR', region: 'Brittany' } );
		expect( cookieWrites.some( write => write.includes( 'country_code=FR' ) ) ).toBe( true );
		expect( cookieWrites.some( write => write.includes( 'region=Brittany' ) ) ).toBe( true );
	} );
} );

describe( 'initializeGeolocation geoEnabled flag', () => {
	it( 'skips geolocation fetch and treats visitor as unknown when geoEnabled is false', async () => {
		mockGetConfig.mockReturnValue( { ...makeConfig(), geoEnabled: false } );

		const result = await runAction( storeActions.initializeGeolocation() );

		expect( fetchMock ).not.toHaveBeenCalled();
		expect( result ).toMatchObject( { initialized: true, countryCode: UNKNOWN_COUNTRY_CODE } );
	} );
} );

describe( 'updateContextFromGeolocation', () => {
	it( 'does not show the manage-preferences link when geo resolution yields a null country', async () => {
		const context = { isGdprManageLink: false };
		mockGetContext.mockReturnValue( context );
		mockGetConfig.mockReturnValue( makeConfig( { showOnError: false } ) );
		fetchMock.mockRejectedValue( new Error( 'network down' ) );

		await runAction( storeActions.updateContextFromGeolocation() );

		expect( context.isGdprManageLink ).toBe( false );
		expect( console ).toHaveWarned();
	} );
} );
