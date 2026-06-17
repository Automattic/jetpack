import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

// This package runs Jest with `--experimental-vm-modules` (true ESM), where the
// `jest.mock` factory cannot be hoisted. Mock with `jest.unstable_mockModule`
// and pull the module under test in via dynamic `import()` after the mocks are
// registered.
const mockApiFetch = jest.fn();
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
	beforeEach( () => {
		jest.clearAllMocks();
		useDispatch.mockReturnValue( { createErrorNotice } );
	} );

	// jsdom locks `window.location.reload` (non-configurable, non-writable on the
	// instance) and `window.location` can't be redefined, so we can't spy on it.
	// Calling `reload()` emits a "Not implemented: navigation" `console.error`;
	// the success-path tests assert `expect( console ).toHaveErrored()` as proof
	// the reload fired (which also satisfies the strict jest-console guard).
	it( 'POSTs to the module endpoint with the requested active state and reloads on success', async () => {
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
		// The success path reloads the page; jsdom logs an error instead.
		expect( console ).toHaveErrored();
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
		// Disabling also succeeds and reloads.
		expect( console ).toHaveErrored();
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

		// Resolving completes the success path, which reloads the page.
		expect( console ).toHaveErrored();
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
