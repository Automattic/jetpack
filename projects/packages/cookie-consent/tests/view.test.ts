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

type Action = ( ...args: unknown[] ) => unknown;
type StoreDefinition = {
	actions: Record< string, Action >;
	callbacks: {
		init: () => Promise< void >;
	};
};

let storeActions: Record< string, Action >;
let storeCallbacks: StoreDefinition[ 'callbacks' ];
let cookieWrites: string[];
let cookieJar: string;
let fetchMock: jest.Mock< typeof fetch >;
let imageSources: string[];
let originalImage: typeof Image;

const TRACKS_SCRIPT_ID = 'jetpack-cookie-consent-tracks-js';

class MockImage {
	set src( value: string ) {
		imageSources.push( value );
	}
}

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

/**
 * Define the optional WP Consent API setter for tests that need the banner init path.
 *
 * @param {Function} implementation - Optional setter body, e.g. to write the consent cookie.
 */
function mockWpSetConsent( implementation?: ( category: string, value: string ) => void ): void {
	Object.defineProperty( window, 'wp_set_consent', {
		configurable: true,
		value: jest.fn( implementation ),
	} );
}

/**
 * Import the view module fresh, so its module-level state and load-time code run again.
 */
async function importView(): Promise< void > {
	jest.resetModules();
	await import( '../src/modules/cookie-consent/view' );
}

beforeEach( async () => {
	cookieWrites = [];
	cookieJar = '';
	imageSources = [];
	originalImage = global.Image;
	global.Image = MockImage as unknown as typeof Image;
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
	mockStore.mockImplementation( ( _namespace: string, config: StoreDefinition ) => {
		storeActions = config.actions;
		storeCallbacks = config.callbacks;
		// Like the runtime, actions called from the view run their generators to completion.
		const runtimeActions = Object.fromEntries(
			Object.entries( config.actions ).map( ( [ name, action ] ) => [
				name,
				( ...args: unknown[] ) => {
					const result = action( ...args );
					return isGenerator( result ) ? runAction( result ) : result;
				},
			] )
		);
		return { ...config, actions: runtimeActions };
	} );

	// Re-import per test so the module-level geoState singleton starts uninitialized.
	mockGetConfig.mockReset();
	await importView();
} );

afterEach( () => {
	global.Image = originalImage;
	delete ( window as unknown as { jetpackCookieConsentConfig?: unknown } )
		.jetpackCookieConsentConfig;
} );

/**
 * Stub the frontend feature flags read by isFeatureEnabled().
 *
 * @param {Record<string, boolean>} features - Feature flags to expose under jetpackCookieConsentConfig.
 */
function setFeatures( features: Record< string, boolean > ): void {
	(
		window as unknown as { jetpackCookieConsentConfig?: { features: Record< string, boolean > } }
	 ).jetpackCookieConsentConfig = { features };
}

/**
 * Resolve a GDPR country (FR) from the geo provider so handleConsentByRegion runs.
 */
function mockGdprGeoLookup(): void {
	fetchMock.mockResolvedValue( {
		ok: true,
		json: async () => ( { country_short: 'FR', region: '' } ),
	} as unknown as Response );
}

describe( 'initializeGeolocation geo-provider error handling', () => {
	it( 'suppresses geo state and writes no fallback cookie when showOnError is false and the fetch fails', async () => {
		mockGetConfig.mockReturnValue( makeConfig( { showOnError: false } ) );
		fetchMock.mockRejectedValue( new Error( 'network down' ) );

		const result = await runAction(
			storeActions.initializeGeolocation() as Generator< unknown, unknown, unknown >
		);

		expect( result ).toEqual( { initialized: true, countryCode: null, region: null } );
		expect( cookieWrites ).toHaveLength( 0 );
		expect( console ).toHaveWarned();
	} );

	it( 'falls back to UNKNOWN and caches a country cookie when showOnError is true and the fetch fails', async () => {
		mockGetConfig.mockReturnValue( makeConfig( { showOnError: true } ) );
		fetchMock.mockRejectedValue( new Error( 'network down' ) );

		const result = await runAction(
			storeActions.initializeGeolocation() as Generator< unknown, unknown, unknown >
		);

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
		const result = await runAction(
			storeActions.initializeGeolocation() as Generator< unknown, unknown, unknown >
		);

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

		const result = await runAction(
			storeActions.initializeGeolocation() as Generator< unknown, unknown, unknown >
		);

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

describe( 'updateContextFromGeolocation banner-feature gate', () => {
	it( 'auto-shows the banner for a GDPR visitor when the banner feature is on', async () => {
		const context = { showBanner: false };
		mockGetContext.mockReturnValue( context );
		mockGetConfig.mockReturnValue( makeConfig() );
		setFeatures( { banner: true } );
		mockGdprGeoLookup();

		await runAction(
			storeActions.updateContextFromGeolocation() as Generator< unknown, unknown, unknown >
		);

		expect( context.showBanner ).toBe( true );
	} );

	it( 'does not auto-show the banner when the banner feature is off (footer-links-only site)', async () => {
		// The banner markup is rendered so the footer "Manage Privacy Preferences" link can
		// reopen the modal; with the banner feature off it must never pop for a GDPR visitor.
		const context = { showBanner: false };
		mockGetContext.mockReturnValue( context );
		mockGetConfig.mockReturnValue( makeConfig() );
		setFeatures( { banner: false } );
		mockGdprGeoLookup();

		await runAction(
			storeActions.updateContextFromGeolocation() as Generator< unknown, unknown, unknown >
		);

		expect( context.showBanner ).toBe( false );
	} );
} );

describe( 'GPC for a returning visitor', () => {
	const ALL_ALLOWED =
		'wp_consent_functional=allow; wp_consent_statistics=allow; wp_consent_statistics-anonymous=allow; wp_consent_marketing=allow';
	let originalGpc: PropertyDescriptor | undefined;

	const setGpc = ( value: boolean | undefined ) => {
		Object.defineProperty( window.navigator, 'globalPrivacyControl', {
			configurable: true,
			value,
		} );
	};

	const wpSetConsentCalls = () =>
		( window.wp_set_consent as unknown as jest.Mock ).mock.calls as Array< [ string, string ] >;

	// Write the consent cookie like the WP Consent API, so later reads see the opt-out.
	const setConsentCookie = ( category: string, value: string ) => {
		const name = `wp_consent_${ category }`;
		cookieJar = [
			...cookieJar.split( '; ' ).filter( pair => pair && ! pair.startsWith( `${ name }=` ) ),
			`${ name }=${ value }`,
		].join( '; ' );
	};

	beforeEach( () => {
		originalGpc = Object.getOwnPropertyDescriptor( window.navigator, 'globalPrivacyControl' );
		mockWpSetConsent( setConsentCookie );
	} );

	afterEach( () => {
		delete ( window as unknown as { _tkq?: unknown } )._tkq;
		delete ( window as unknown as { wp_set_consent?: unknown } ).wp_set_consent;
		document.getElementById( TRACKS_SCRIPT_ID )?.remove();
		if ( originalGpc ) {
			Object.defineProperty( window.navigator, 'globalPrivacyControl', originalGpc );
		} else {
			delete ( window.navigator as unknown as { globalPrivacyControl?: unknown } )
				.globalPrivacyControl;
		}
	} );

	it( 'keeps the stored choice on init when it was made with GPC on', async () => {
		setGpc( true );
		cookieJar = `${ ALL_ALLOWED }; jetpack_cookie_consent_gpc=1`;
		mockGetContext.mockReturnValue( { showBanner: false } );
		mockGetConfig.mockReturnValue( makeConfig() );

		await storeCallbacks.init();

		expect( wpSetConsentCalls() ).toHaveLength( 0 );
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
	} );

	it( 'opts out a returning GDPR visitor who turned GPC on, without loading Tracks', async () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;
		const context = { showBanner: false };
		mockGetContext.mockReturnValue( context );
		mockGetConfig.mockReturnValue( makeConfig() );
		mockGdprGeoLookup();

		await storeCallbacks.init();

		expect( wpSetConsentCalls() ).toContainEqual( [ 'marketing', 'deny' ] );
		expect( wpSetConsentCalls() ).toContainEqual( [ 'statistics', 'deny' ] );
		expect( context.showBanner ).toBe( false );
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
	} );

	it( 'opts out a returning visitor with geo off', async () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;
		mockGetContext.mockReturnValue( { showBanner: false } );
		mockGetConfig.mockReturnValue( { ...makeConfig(), geoEnabled: false } );

		await storeCallbacks.init();

		expect( fetchMock ).not.toHaveBeenCalled();
		expect( wpSetConsentCalls() ).toContainEqual( [ 'marketing', 'deny' ] );
	} );

	it( 'keeps the stored choice and loads Tracks when geo fails with showOnError off', async () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;
		mockGetContext.mockReturnValue( { showBanner: false } );
		mockGetConfig.mockReturnValue( makeConfig( { showOnError: false } ) );
		fetchMock.mockRejectedValue( new Error( 'network down' ) );

		await storeCallbacks.init();

		expect( wpSetConsentCalls() ).toHaveLength( 0 );
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
		expect( console ).toHaveWarned();
	} );

	it( 'opts out at module load when the geo cookies hold the region', async () => {
		setGpc( true );
		cookieJar = `${ ALL_ALLOWED }; country_code=FR; region=Brittany`;
		mockGetConfig.mockReturnValue( makeConfig() );

		await importView();

		expect( fetchMock ).not.toHaveBeenCalled();
		expect( wpSetConsentCalls() ).toContainEqual( [ 'statistics', 'deny' ] );
		expect( cookieJar ).toContain( 'wp_consent_statistics=deny' );
	} );

	it( 'opts out at module load with geo off', async () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;
		mockGetConfig.mockReturnValue( { ...makeConfig(), geoEnabled: false } );

		await importView();

		expect( wpSetConsentCalls() ).toContainEqual( [ 'marketing', 'deny' ] );
	} );

	it( 'leaves the conflict to init at module load when the region needs a lookup', async () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;
		mockGetConfig.mockReturnValue( makeConfig() );

		await importView();

		expect( fetchMock ).not.toHaveBeenCalled();
		expect( wpSetConsentCalls() ).toHaveLength( 0 );
	} );

	it.each( [
		[ 'opts out', { banner: false, footer_links: true }, true ],
		[ 'leaves the choice to another CMP', { banner: false, footer_links: false }, false ],
	] )( '%s at module load with only %o of the consent UI', async ( _, features, optedOut ) => {
		setGpc( true );
		setFeatures( { ...features, ccpa_page: true } );
		cookieJar = `${ ALL_ALLOWED }; country_code=FR; region=Brittany`;
		mockGetConfig.mockReturnValue( makeConfig() );

		await importView();

		expect( wpSetConsentCalls().length > 0 ).toBe( optedOut );
	} );

	it( 'previews the banner with the GPC notice and optional categories off', async () => {
		setGpc( true );
		cookieJar = 'country_code=FR; region=Brittany';
		mockGetConfig.mockReturnValue( { ...makeConfig(), forcePreview: true } );
		await importView();
		const context = {
			showBanner: false,
			gpcNotice: false,
			categories: { required: true, analytics: true, advertising: false },
		};
		mockGetContext.mockReturnValue( context );

		await storeCallbacks.init();

		expect( fetchMock ).not.toHaveBeenCalled();
		expect( context.showBanner ).toBe( true );
		expect( context.gpcNotice ).toBe( true );
		expect( context.categories.analytics ).toBe( false );
	} );

	describe( 'conflict notice', () => {
		const GPC_OPTED_OUT =
			'wp_consent_functional=allow; wp_consent_statistics=deny; wp_consent_statistics-anonymous=deny; wp_consent_marketing=deny';
		const ANALYTICS_ON = {
			target: Object.assign( document.createElement( 'input' ), {
				type: 'checkbox',
				checked: true,
			} ),
		};
		ANALYTICS_ON.target.dataset.consentCategory = 'analytics';

		const openFromFooter = async ( context: Record< string, unknown > ) => {
			mockGetContext.mockReturnValue( context );
			await storeCallbacks.init();
			storeActions.openManagePreferences( { preventDefault: jest.fn() } );
			await new Promise( resolve => setTimeout( resolve, 0 ) );
		};

		beforeEach( () => {
			mockGetConfig.mockReturnValue( makeConfig() );
		} );

		it.each( [
			[ 'a GDPR region', 'FR', 'Brittany', true ],
			[ 'a CCPA region', 'US', 'California', true ],
			[ 'a region that ignores GPC', 'US', 'Texas', false ],
		] )( 'is shown in the footer modal for %s', async ( _, country, region, shown ) => {
			setGpc( true );
			cookieJar = `${ GPC_OPTED_OUT }; country_code=${ country }; region=${ region }`;
			const context = { showBanner: false, showModal: false, gpcNotice: false, categories: {} };

			await openFromFooter( context );

			expect( context.showModal ).toBe( true );
			expect( context.gpcNotice ).toBe( shown );
		} );

		it.each( [
			[ 'shows', true, 'California', true ],
			[ 'hides', false, 'California', false ],
			[ 'hides', true, 'Texas', false ],
		] )(
			'%s the footer link to a US visitor with GPC %s in %s, which opens the notice',
			async ( _, gpc, region, shown ) => {
				setGpc( gpc );
				cookieJar = `${ GPC_OPTED_OUT }; country_code=US; region=${ region }`;
				const link = { isGdprManageLink: false };
				mockGetContext.mockReturnValue( link );
				await storeCallbacks.init();

				expect( link.isGdprManageLink ).toBe( shown );

				const context = { showBanner: false, showModal: false, gpcNotice: false, categories: {} };
				await openFromFooter( context );

				expect( context.gpcNotice ).toBe( shown );
			}
		);

		it( 'is not shown with the banner to a GDPR visitor without GPC', async () => {
			setGpc( false );
			const context = { showBanner: false, gpcNotice: false };
			mockGetContext.mockReturnValue( context );
			mockGdprGeoLookup();

			await runAction(
				storeActions.updateContextFromGeolocation() as Generator< unknown, unknown, unknown >
			);

			expect( context.showBanner ).toBe( true );
			expect( context.gpcNotice ).toBe( false );
		} );

		it( 'looks up the region for a returning visitor whose geo cookies expired', async () => {
			setGpc( true );
			cookieJar = GPC_OPTED_OUT;
			mockGdprGeoLookup();
			const context = { showBanner: false, showModal: false, gpcNotice: false, categories: {} };

			await openFromFooter( context );

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );
			expect( context.gpcNotice ).toBe( true );
		} );

		it( 'sends one geo request when init and the footer link both need the region', async () => {
			setGpc( true );
			cookieJar = ALL_ALLOWED;
			mockGdprGeoLookup();
			const context = { showBanner: false, showModal: false, gpcNotice: false, categories: {} };
			mockGetContext.mockReturnValue( context );

			const initDone = storeCallbacks.init();
			storeActions.openManagePreferences( { preventDefault: jest.fn() } );
			await initDone;
			await new Promise( resolve => setTimeout( resolve, 0 ) );

			expect( fetchMock ).toHaveBeenCalledTimes( 1 );
			expect( context.gpcNotice ).toBe( true );
		} );

		it( 'grants nothing when the visitor switches a category on and then dismisses the modal', async () => {
			setGpc( true );
			cookieJar = `${ GPC_OPTED_OUT }; country_code=FR; region=Brittany`;
			const context = { showBanner: false, showModal: false, gpcNotice: false, categories: {} };
			await openFromFooter( context );

			storeActions.toggleCategory( ANALYTICS_ON );
			storeActions.onModalKeyDown( { key: 'Escape', preventDefault: jest.fn() } );
			storeActions.closeModal();

			expect( context.showModal ).toBe( false );
			expect( wpSetConsentCalls() ).toHaveLength( 0 );
			expect(
				cookieWrites.some( write => write.startsWith( 'jetpack_cookie_consent_gpc=' ) )
			).toBe( false );
			expect( cookieJar ).toContain( 'wp_consent_statistics=deny' );
		} );

		it( 'keeps the choice over GPC when the visitor switches a category on and saves', async () => {
			setGpc( true );
			cookieJar = `${ GPC_OPTED_OUT }; country_code=FR; region=Brittany`;
			const context = { showBanner: false, showModal: false, gpcNotice: false, categories: {} };
			await openFromFooter( context );

			storeActions.toggleCategory( ANALYTICS_ON );
			storeActions.savePreferences();

			expect( wpSetConsentCalls() ).toContainEqual( [ 'statistics', 'allow' ] );
			expect( wpSetConsentCalls() ).toContainEqual( [ 'marketing', 'deny' ] );
			expect(
				cookieWrites.some( write => write.startsWith( 'jetpack_cookie_consent_gpc=1;' ) )
			).toBe( true );
		} );
	} );

	it( 'keeps the stored choice and loads Tracks in an unregulated region', async () => {
		setGpc( true );
		cookieJar = ALL_ALLOWED;
		const context = { showBanner: false };
		mockGetContext.mockReturnValue( context );
		mockGetConfig.mockReturnValue( makeConfig() );
		fetchMock.mockResolvedValue( {
			ok: true,
			json: async () => ( { country_short: 'US', region: 'Texas' } ),
		} as unknown as Response );

		await storeCallbacks.init();

		expect( wpSetConsentCalls() ).toHaveLength( 0 );
		expect( context.showBanner ).toBe( false );
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
	} );
} );

describe( 'updateContextFromGeolocation', () => {
	it( 'does not show the manage-preferences link when geo resolution yields a null country', async () => {
		const context = { isGdprManageLink: false };
		mockGetContext.mockReturnValue( context );
		mockGetConfig.mockReturnValue( makeConfig( { showOnError: false } ) );
		fetchMock.mockRejectedValue( new Error( 'network down' ) );

		await runAction(
			storeActions.updateContextFromGeolocation() as Generator< unknown, unknown, unknown >
		);

		expect( context.isGdprManageLink ).toBe( false );
		expect( console ).toHaveWarned();
	} );
} );

describe( 'Tracks consent gating', () => {
	afterEach( () => {
		delete ( window as unknown as { _tkq?: unknown } )._tkq;
		delete ( window as unknown as { wp_set_consent?: unknown } ).wp_set_consent;
		document.getElementById( TRACKS_SCRIPT_ID )?.remove();
	} );

	it( 'records a cookieless banner stat in preview mode', async () => {
		const context = { showBanner: false };
		mockWpSetConsent();
		mockGetContext.mockReturnValue( context );
		mockGetConfig.mockReturnValue( { ...makeConfig(), forcePreview: true } );

		await storeCallbacks.init();

		expect( context.showBanner ).toBe( true );
		expect( window._tkq ).toBeUndefined();
		expect(
			new URL( imageSources[ 0 ] ).searchParams.get(
				'x_jetpack-cookie-consent-privacy-banner-view'
			)
		).toBe( `total,${ window.location.hostname }` );
	} );

	it( 'loads Tracks on init for a returning visitor who granted analytics', async () => {
		cookieJar =
			'wp_consent_functional=allow; wp_consent_statistics=allow; wp_consent_statistics-anonymous=allow';
		mockWpSetConsent();
		mockGetContext.mockReturnValue( { showBanner: false } );
		mockGetConfig.mockReturnValue( makeConfig() );

		await storeCallbacks.init();

		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
	} );

	it( 'does not load Tracks on init for a returning visitor who denied analytics', async () => {
		cookieJar = 'wp_consent_functional=allow; wp_consent_statistics=deny';
		mockWpSetConsent();
		mockGetContext.mockReturnValue( { showBanner: false } );
		mockGetConfig.mockReturnValue( makeConfig() );

		await storeCallbacks.init();

		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
		expect( window._tkq ).toBeUndefined();
	} );

	it( 'loads Tracks when a consent lifecycle event grants analytics', async () => {
		mockWpSetConsent();
		mockGetContext.mockReturnValue( {} );
		mockGetConfig.mockReturnValue( makeConfig() );
		mockGdprGeoLookup();

		await storeCallbacks.init();
		window.dispatchEvent(
			new CustomEvent( 'wp_consent_saved', {
				detail: {
					eventType: 'accept_selected',
					choices: {
						required: true,
						analytics: true,
						advertising: false,
					},
				},
			} )
		);

		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
	} );

	it( 'does not load Tracks when a consent lifecycle event denies analytics', async () => {
		mockWpSetConsent();
		mockGetContext.mockReturnValue( {} );
		mockGetConfig.mockReturnValue( makeConfig() );
		mockGdprGeoLookup();

		await storeCallbacks.init();
		window.dispatchEvent(
			new CustomEvent( 'wp_consent_saved', {
				detail: {
					eventType: 'reject_all',
					choices: {
						required: true,
						analytics: false,
						advertising: false,
					},
				},
			} )
		);

		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
	} );

	it( 'skips Tracks and records a cookieless accept stat when saving preferences with analytics declined', () => {
		mockWpSetConsent();
		mockGetContext.mockReturnValue( {
			categories: { required: true, analytics: false, advertising: false },
		} );
		mockGetConfig.mockReturnValue( makeConfig() );

		storeActions.savePreferences();

		expect( window._tkq ).toBeUndefined();
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
		expect(
			new URL( imageSources[ 0 ] ).searchParams.get(
				'x_jetpack-cookie-consent-privacy-banner-button-accept'
			)
		).toBe( `total,${ window.location.hostname }` );
	} );

	it( 'loads Tracks and records the accept event when saving preferences with analytics granted', () => {
		mockWpSetConsent();
		mockGetContext.mockReturnValue( {
			categories: { required: true, analytics: true, advertising: false },
		} );
		mockGetConfig.mockReturnValue( makeConfig() );

		storeActions.savePreferences();

		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
		expect( window._tkq?.[ 0 ]?.[ 1 ] ).toBe( 'jetpack_privacy_banner_button_accept' );
	} );

	it( 'records pre-consent manage opens through the cookieless stat', () => {
		const event = { preventDefault: jest.fn() } as unknown as MouseEvent;

		storeActions.openManagePreferences( event );

		expect( event.preventDefault ).toHaveBeenCalled();
		expect( window._tkq ).toBeUndefined();
		expect(
			new URL( imageSources[ 0 ] ).searchParams.get(
				'x_jetpack-cookie-consent-privacy-manage-open'
			)
		).toBe( `total,${ window.location.hostname }` );
	} );

	it( 'records post-consent manage opens through the cookieless stat when analytics is denied', () => {
		cookieJar = 'wp_consent_functional=allow; wp_consent_statistics=deny';
		const event = { preventDefault: jest.fn() } as unknown as MouseEvent;

		storeActions.openManagePreferences( event );

		expect( window._tkq ).toBeUndefined();
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).toBeNull();
		expect(
			new URL( imageSources[ 0 ] ).searchParams.get(
				'x_jetpack-cookie-consent-privacy-manage-open'
			)
		).toBe( `total,${ window.location.hostname }` );
	} );

	it( 'records post-consent manage opens when analytics is allowed', () => {
		cookieJar =
			'wp_consent_functional=allow; wp_consent_statistics=allow; wp_consent_statistics-anonymous=allow';
		const event = { preventDefault: jest.fn() } as unknown as MouseEvent;

		storeActions.openManagePreferences( event );

		expect( window._tkq?.[ 0 ] ).toEqual( [
			'recordEvent',
			'jetpack_privacy_manage_open',
			expect.objectContaining( {
				domain: window.location.hostname,
			} ),
		] );
		expect( document.getElementById( TRACKS_SCRIPT_ID ) ).not.toBeNull();
	} );
} );
