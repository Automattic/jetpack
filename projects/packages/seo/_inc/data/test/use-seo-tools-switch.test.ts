import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

// This package runs Jest with `--experimental-vm-modules` (true ESM), where the
// `jest.mock` factory cannot be hoisted. Mock with `jest.unstable_mockModule`
// and pull the module under test in via dynamic `import()` after the mocks are
// registered.
const mockApiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
const createErrorNotice = jest.fn();
const useDispatch = jest.fn( () => ( { createErrorNotice } ) );

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: mockApiFetch,
} ) );
// Mock `@wordpress/data` to expose only `useDispatch` — the hook under test
// uses nothing else, and a full mock keeps the real data store (which pulls in
// `keyedReducer` etc.) out of the graph.
jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch,
} ) );
// Likewise stub the notices store so importing it doesn't register against the
// real (now-mocked) data module.
jest.unstable_mockModule( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

const { default: useSeoToolsSwitch } = await import( '../use-seo-tools-switch' );

describe( 'useSeoToolsSwitch', () => {
	// The success path calls `window.location.reload()`. jsdom can't navigate and
	// can't be made to spy on `location.reload` (`window.location` is
	// non-configurable and can't be redefined), so the call surfaces as a
	// "Not implemented: navigation" `console.error`. Silence it here so the
	// strict `jetpack-js-tools` console guard doesn't flag it; the success-path
	// tests assert the deterministic, observable behavior instead — `apiFetch`
	// was POSTed with the right payload and no error notice was raised.
	let consoleErrorSpy: ReturnType< typeof jest.spyOn >;

	beforeEach( () => {
		jest.clearAllMocks();
		useDispatch.mockReturnValue( { createErrorNotice } );
		consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		consoleErrorSpy.mockRestore();
	} );

	it.each( [ true, false ] )(
		'POSTs active: %s to the module endpoint on success',
		async active => {
			mockApiFetch.mockResolvedValue( undefined );

			const { result } = renderHook( () => useSeoToolsSwitch( 'overview' ) );

			expect( result.current.isSwitching ).toBe( false );

			await act( async () => {
				await result.current.setActive( active );
			} );

			expect( mockApiFetch ).toHaveBeenCalledWith( {
				path: '/jetpack/v4/module/seo-tools/active',
				method: 'POST',
				data: { active },
			} );
			// On success we reload rather than notify, so no error notice is raised.
			expect( createErrorNotice ).not.toHaveBeenCalled();
		}
	);

	it( 'sets isSwitching while the request is in flight', async () => {
		let resolveFetch: () => void;
		mockApiFetch.mockReturnValue(
			new Promise< void >( resolve => {
				resolveFetch = resolve;
			} )
		);

		const { result } = renderHook( () => useSeoToolsSwitch( 'overview' ) );

		act( () => {
			result.current.setActive( true );
		} );

		await waitFor( () => expect( result.current.isSwitching ).toBe( true ) );

		await act( async () => {
			resolveFetch();
		} );

		// Resolving completes the success path, which reloads rather than notifies.
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ true, 'Could not enable SEO tools. Please try again.' ],
		[ false, 'Could not disable SEO tools. Please try again.' ],
	] )(
		'surfaces an error snackbar notice and clears isSwitching when active: %s is rejected',
		async ( active, message ) => {
			mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

			const { result } = renderHook( () => useSeoToolsSwitch( 'overview' ) );

			await act( async () => {
				await result.current.setActive( active );
			} );

			// On failure we don't reload (no jsdom navigation error) — just notify.
			expect( createErrorNotice ).toHaveBeenCalledWith( message, {
				id: 'seo-tools-toggle',
				type: 'snackbar',
			} );
			await waitFor( () => expect( result.current.isSwitching ).toBe( false ) );
		}
	);
} );
