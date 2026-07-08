/**
 * Regression tests for FORMS-712.
 *
 * After returning from a plan purchase, gated blocks (e.g. the Forms file-upload
 * field) kept showing their upgrade nudge because the editor rendered block
 * availability from a plan that was still cached from before the purchase. The
 * reload fallback re-runs the editor once when the rendered plan slug differs from
 * the freshly fetched slug, but only for non-Simple sites, only once per rendered
 * plan, and only when the guard can be persisted (so storage-denied browsers never
 * loop).
 */

const RELOAD_GUARD_KEY = 'jetpackPlanUpgradedReloadedForSlug';

const mockApiFetch = jest.fn();
const mockCreateNotice = jest.fn();
let mockIsSimpleSite = false;

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn( () => false ),
	isSimpleSite: jest.fn( () => mockIsSimpleSite ),
} ) );
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getSiteFragment: jest.fn( () => 'example.com' ),
} ) );
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args ) => mockApiFetch( ...args ),
} ) );
jest.mock( '@wordpress/data', () => ( {
	dispatch: () => ( { createNotice: mockCreateNotice } ),
} ) );
jest.mock( '@wordpress/notices', () => ( {} ) );

import { shouldReloadAfterPlanUpgrade } from '../plan-upgrade-notification';

describe( 'shouldReloadAfterPlanUpgrade', () => {
	const base = {
		isSimple: false,
		freshPlanSlug: 'jetpack_complete',
		renderedPlanSlug: 'jetpack_free',
		alreadyReloaded: false,
	};

	it( 'reloads when the rendered plan is stale relative to the fresh plan', () => {
		expect( shouldReloadAfterPlanUpgrade( base ) ).toBe( true );
	} );

	it( 'does not reload once a reload was already attempted (single-attempt guard)', () => {
		expect( shouldReloadAfterPlanUpgrade( { ...base, alreadyReloaded: true } ) ).toBe( false );
	} );

	it( 'does not reload when the rendered plan already matches the fresh plan', () => {
		expect(
			shouldReloadAfterPlanUpgrade( { ...base, renderedPlanSlug: 'jetpack_complete' } )
		).toBe( false );
	} );

	it( 'does not reload on Simple sites, which gate features live', () => {
		expect( shouldReloadAfterPlanUpgrade( { ...base, isSimple: true } ) ).toBe( false );
	} );

	it( 'does not reload when the fresh plan slug could not be determined', () => {
		expect( shouldReloadAfterPlanUpgrade( { ...base, freshPlanSlug: null } ) ).toBe( false );
	} );

	it( 'does not reload when the rendered plan slug is unknown', () => {
		expect( shouldReloadAfterPlanUpgrade( { ...base, renderedPlanSlug: undefined } ) ).toBe(
			false
		);
	} );
} );

describe( 'plan-upgrade-notification IIFE', () => {
	let reloadSpy;

	const flush = async () => {
		// The IIFE awaits apiFetch, then runs synchronously; flush a couple of ticks.
		await Promise.resolve();
		await new Promise( resolve => setTimeout( resolve, 0 ) );
	};

	const setSearch = search =>
		window.history.replaceState( {}, '', '/wp-admin/post.php' + ( search ? `?${ search }` : '' ) );

	// Load the module fresh so its IIFE re-runs against the current window state.
	const loadModule = () => {
		jest.resetModules();
		jest.isolateModules( () => {
			require( '../plan-upgrade-notification' );
		} );
	};

	beforeEach( () => {
		mockIsSimpleSite = false;
		mockApiFetch.mockReset();
		mockCreateNotice.mockReset();
		window.sessionStorage.clear();
		window.Jetpack_Editor_Initial_State = {
			wpcomBlogId: 1,
			jetpack: { jetpack_plan: { data: 'jetpack_free' } },
		};
		// jsdom's reload is unimplemented; spy so we can assert without navigating.
		reloadSpy = jest.spyOn( window.location, 'reload' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		reloadSpy.mockRestore();
		jest.restoreAllMocks();
	} );

	const resolveWith = slug =>
		mockApiFetch.mockResolvedValue( {
			data: JSON.stringify( { plan: { product_name: 'Complete', product_slug: slug } } ),
		} );

	it( 'clears the guard and does nothing on normal navigation (no plan_upgraded)', async () => {
		window.sessionStorage.setItem( RELOAD_GUARD_KEY, 'jetpack_free' );
		setSearch( '' );

		loadModule();
		await flush();

		expect( window.sessionStorage.getItem( RELOAD_GUARD_KEY ) ).toBeNull();
		expect( reloadSpy ).not.toHaveBeenCalled();
		expect( mockCreateNotice ).not.toHaveBeenCalled();
	} );

	it( 'reloads once and records the rendered slug when the fresh plan differs', async () => {
		setSearch( 'plan_upgraded=1' );
		resolveWith( 'jetpack_complete' ); // fresh differs from rendered jetpack_free

		loadModule();
		await flush();

		expect( reloadSpy ).toHaveBeenCalledTimes( 1 );
		expect( window.sessionStorage.getItem( RELOAD_GUARD_KEY ) ).toBe( 'jetpack_free' );
		// Reload returns before the notice fires.
		expect( mockCreateNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not reload again once the guard already matches the rendered slug', async () => {
		window.sessionStorage.setItem( RELOAD_GUARD_KEY, 'jetpack_free' );
		setSearch( 'plan_upgraded=1' );
		resolveWith( 'jetpack_complete' );

		loadModule();
		await flush();

		expect( reloadSpy ).not.toHaveBeenCalled();
		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows the notice without reloading when the rendered plan already matches', async () => {
		setSearch( 'plan_upgraded=1' );
		resolveWith( 'jetpack_free' ); // fresh equals rendered

		loadModule();
		await flush();

		expect( reloadSpy ).not.toHaveBeenCalled();
		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'falls through to a generic notice without reloading when the plan fetch fails', async () => {
		setSearch( 'plan_upgraded=1' );
		mockApiFetch.mockRejectedValue( new Error( 'network' ) );

		loadModule();
		await flush();

		expect( reloadSpy ).not.toHaveBeenCalled();
		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not reload (and does not throw) when sessionStorage reads throw', async () => {
		setSearch( 'plan_upgraded=1' );
		resolveWith( 'jetpack_complete' );
		jest.spyOn( window.sessionStorage, 'getItem' ).mockImplementation( () => {
			throw new Error( 'SecurityError' );
		} );

		loadModule();
		await flush();

		// Unreadable storage reports "already reloaded" -> no reload, no loop.
		expect( reloadSpy ).not.toHaveBeenCalled();
		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not reload when the guard cannot be persisted (sessionStorage writes throw)', async () => {
		setSearch( 'plan_upgraded=1' );
		resolveWith( 'jetpack_complete' );
		jest.spyOn( window.sessionStorage, 'setItem' ).mockImplementation( () => {
			throw new Error( 'QuotaExceededError' );
		} );

		loadModule();
		await flush();

		// Cannot persist the one-shot guard -> refuse the reload, avoid a loop.
		expect( reloadSpy ).not.toHaveBeenCalled();
		expect( mockCreateNotice ).toHaveBeenCalledTimes( 1 );
	} );
} );
