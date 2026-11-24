import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

// True-ESM Jest (`--experimental-vm-modules`): register the mocks with
// `jest.unstable_mockModule` and import the module under test dynamically after.
const mockApiFetch = jest.fn< ( options: { path: string } ) => Promise< unknown > >();
const notices = {
	createErrorNotice: jest.fn(),
	createInfoNotice: jest.fn(),
	createSuccessNotice: jest.fn(),
};
const setSeoToolsActive = jest.fn();
const writePreloaded = jest.fn();
const forgetPreloaded = jest.fn();
const recordSeoEvent = jest.fn();

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: ( store: string ) => ( store === 'core/notices' ? notices : { setSeoToolsActive } ),
} ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '../settings-store', () => ( {
	settingsStore: 'jetpack-seo/settings',
} ) );
jest.unstable_mockModule( '../record-seo-event', () => ( { recordSeoEvent } ) );
jest.unstable_mockModule( '../get-preloaded', () => ( {
	OVERVIEW_PATH: '/jetpack/v4/seo/overview',
	GEO_PATH: '/jetpack/v4/seo/geo',
	CONTENT_PATH: '/jetpack/v4/seo/content',
	writePreloaded,
	forgetPreloaded,
} ) );

const { default: useSeoToolsSwitch } = await import( '../use-seo-tools-switch' );

const MODULES_PATH = '/jetpack/v4/seo/modules';

describe( 'useSeoToolsSwitch', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it.each( [ true, false ] )(
		'saves active: %s, refreshes the other tabs, then updates the store',
		async active => {
			const overview = { site_visibility: { seo_tools_active: active } };
			mockApiFetch.mockImplementation( async ( { path } ) =>
				path === MODULES_PATH ? { seo_tools_active: active } : overview
			);

			const { result } = renderHook( () => useSeoToolsSwitch( 'settings' ) );
			await act( () => result.current.setActive( active ) );

			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: MODULES_PATH,
				method: 'POST',
				data: { seo_tools_active: active },
			} );
			expect( forgetPreloaded.mock.calls ).toEqual( [
				[ '/jetpack/v4/seo/geo' ],
				[ '/jetpack/v4/seo/content' ],
			] );
			expect( writePreloaded ).toHaveBeenCalledWith( '/jetpack/v4/seo/overview', overview );
			// The tabs follow the store, so they must not change before the Overview behind them.
			expect( setSeoToolsActive ).toHaveBeenCalledWith( active );
			expect( writePreloaded.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
				setSeoToolsActive.mock.invocationCallOrder[ 0 ]
			);
			expect( notices.createSuccessNotice ).toHaveBeenCalledWith( 'Settings saved.', {
				id: 'seo-tools-toggle',
				type: 'snackbar',
			} );
			expect( recordSeoEvent ).toHaveBeenCalledWith( 'jetpack_seo_tools_toggled', 'settings', {
				enabled: active,
			} );
			expect( result.current.pending ).toBeNull();
		}
	);

	it( 'shows the requested state while the save is in flight', async () => {
		let resolveSave: ( value: unknown ) => void = () => {};
		mockApiFetch.mockImplementation( ( { path } ) =>
			path === MODULES_PATH
				? new Promise( resolve => {
						resolveSave = resolve;
					} )
				: Promise.resolve( {} )
		);

		const { result } = renderHook( () => useSeoToolsSwitch( 'settings' ) );
		let saving: Promise< void > = Promise.resolve();
		act( () => {
			saving = result.current.setActive( true );
		} );

		expect( result.current.pending ).toBe( true );
		expect( result.current.isSwitching ).toBe( true );

		await act( async () => {
			resolveSave( {} );
			await saving;
		} );

		expect( result.current.isSwitching ).toBe( false );
	} );

	it.each( [
		[ true, 'Could not enable SEO tools. Please try again.' ],
		[ false, 'Could not disable SEO tools. Please try again.' ],
	] )( 'leaves everything as it was when active: %s is refused', async ( active, message ) => {
		mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

		const { result } = renderHook( () => useSeoToolsSwitch( 'settings' ) );
		await act( () => result.current.setActive( active ) );

		expect( notices.createErrorNotice ).toHaveBeenCalledWith( message, {
			id: 'seo-tools-toggle',
			type: 'snackbar',
		} );
		expect( setSeoToolsActive ).not.toHaveBeenCalled();
		expect( forgetPreloaded ).not.toHaveBeenCalled();
		expect( recordSeoEvent ).not.toHaveBeenCalled();
		expect( result.current.pending ).toBeNull();
	} );

	it.each( [
		[ 'fails', () => Promise.reject( new Error( 'nope' ) ) ],
		[ 'never answers', () => new Promise( () => {} ) ],
	] )( 'still applies the switch when the Overview refresh %s', async ( _case, overview ) => {
		jest.useFakeTimers();
		mockApiFetch.mockImplementation( ( { path } ) =>
			path === MODULES_PATH ? Promise.resolve( {} ) : overview()
		);

		const { result } = renderHook( () => useSeoToolsSwitch( 'settings' ) );
		await act( async () => {
			const saving = result.current.setActive( true );
			await jest.advanceTimersByTimeAsync( 10000 );
			await saving;
		} );

		expect( writePreloaded ).not.toHaveBeenCalled();
		expect( setSeoToolsActive ).toHaveBeenCalledWith( true );
		expect( result.current.pending ).toBeNull();
	} );
} );
