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

const { default: useSeoToolsToggle } = await import( '../use-seo-tools-toggle' );

describe( 'useSeoToolsToggle', () => {
	// The success path calls `window.location.reload()`. jsdom can't navigate and
	// can't be made to spy on `location.reload` (`window.location` is
	// non-configurable and can't be redefined), so the call surfaces as a
	// "Not implemented: navigation" `console.error`. Silence it here so the
	// strict `@wordpress/jest-console` guard doesn't flag it; the success-path
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

	it( 'POSTs to the module endpoint with the requested active state on success', async () => {
		mockApiFetch.mockResolvedValue( undefined );

		const { result } = renderHook( () => useSeoToolsToggle() );

		expect( result.current.isToggling ).toBe( false );

		await act( async () => {
			await result.current.setActive( true );
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/module/seo-tools/active',
			method: 'POST',
			data: { active: true },
		} );
		// On success we reload rather than notify, so no error notice is raised.
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'passes active: false when disabling', async () => {
		mockApiFetch.mockResolvedValue( undefined );

		const { result } = renderHook( () => useSeoToolsToggle() );

		await act( async () => {
			await result.current.setActive( false );
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/module/seo-tools/active',
			method: 'POST',
			data: { active: false },
		} );
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'sets isToggling while the request is in flight', async () => {
		let resolveFetch: () => void;
		mockApiFetch.mockReturnValue(
			new Promise< void >( resolve => {
				resolveFetch = resolve;
			} )
		);

		const { result } = renderHook( () => useSeoToolsToggle() );

		act( () => {
			result.current.setActive( true );
		} );

		await waitFor( () => expect( result.current.isToggling ).toBe( true ) );

		await act( async () => {
			resolveFetch();
		} );

		// Resolving completes the success path, which reloads rather than notifies.
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'surfaces an error snackbar notice and clears isToggling when the request rejects', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

		const { result } = renderHook( () => useSeoToolsToggle() );

		await act( async () => {
			await result.current.setActive( true );
		} );

		// On failure we don't reload (no jsdom navigation error) — just notify.
		expect( createErrorNotice ).toHaveBeenCalledWith(
			'Could not enable SEO tools. Please try again.',
			{ id: 'seo-tools-toggle', type: 'snackbar' }
		);
		await waitFor( () => expect( result.current.isToggling ).toBe( false ) );
	} );

	it( 'uses the disable error message when disabling fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

		const { result } = renderHook( () => useSeoToolsToggle() );

		await act( async () => {
			await result.current.setActive( false );
		} );

		expect( createErrorNotice ).toHaveBeenCalledWith(
			'Could not disable SEO tools. Please try again.',
			{ id: 'seo-tools-toggle', type: 'snackbar' }
		);
	} );
} );
