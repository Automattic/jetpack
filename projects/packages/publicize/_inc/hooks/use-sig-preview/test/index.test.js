import { renderHook, act, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import useSigPreview from '../';
import useImageGeneratorConfig from '../../use-image-generator-config';
import { FEATURED_IMAGE_STILL_LOADING } from '../utils';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );
jest.mock( '../../use-image-generator-config', () => jest.fn() );
jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.fn( ( slug, { query } ) => `https://example.com/${ slug }?${ query }` ),
} ) );

const mockImageGeneratorConfig = {
	customText: '',
	imageType: 'featured',
	imageId: null,
	defaultImageId: 1,
	template: 'flavor',
	setToken: jest.fn(),
	font: 'roboto',
	isEnabled: true,
	token: null,
	setIsEnabled: jest.fn(),
	updateSettings: jest.fn(),
};

describe( 'useSigPreview', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();

		useImageGeneratorConfig.mockReturnValue( { ...mockImageGeneratorConfig } );

		useSelect.mockReturnValue( {
			title: 'Test Post Title',
			imageUrl: 'https://example.com/image.jpg',
		} );

		apiFetch.mockResolvedValue( 'test-token-123' );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'should return null URL and not loading when disabled', () => {
		const { result } = renderHook( () => useSigPreview( false ) );

		expect( result.current.url ).toBeNull();
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'should show loading state when enabled', () => {
		const { result } = renderHook( () => useSigPreview( true ) );

		expect( result.current.isLoading ).toBe( true );
		expect( result.current.url ).toBeNull();
	} );

	it( 'should fetch and set the SIG preview URL when enabled', async () => {
		const mockSetToken = jest.fn();
		useImageGeneratorConfig.mockReturnValue( {
			...mockImageGeneratorConfig,
			setToken: mockSetToken,
		} );

		const { result } = renderHook( () => useSigPreview( true ) );

		// Initially loading
		expect( result.current.isLoading ).toBe( true );

		// Fast-forward timers to trigger the API call
		await act( async () => {
			jest.runAllTimers();
		} );

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: 'wpcom/v2/publicize/social-image-generator/generate-token',
			method: 'POST',
			data: {
				text: 'Test Post Title',
				image_url: 'https://example.com/image.jpg',
				template: 'flavor',
				font: 'roboto',
			},
		} );
		expect( mockSetToken ).toHaveBeenCalledWith( 'test-token-123' );
		expect( result.current.url ).toBe( 'https://example.com/sigenerate?t=test-token-123' );
	} );

	it( 'should use customText when available instead of title', async () => {
		useImageGeneratorConfig.mockReturnValue( {
			...mockImageGeneratorConfig,
			customText: 'Custom Text',
		} );

		renderHook( () => useSigPreview( true ) );

		await act( async () => {
			jest.runAllTimers();
		} );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: expect.objectContaining( {
					text: 'Custom Text',
				} ),
			} )
		);
	} );

	it( 'should not fetch when image is still loading', async () => {
		useSelect.mockReturnValue( {
			title: 'Test Post Title',
			imageUrl: FEATURED_IMAGE_STILL_LOADING,
		} );

		renderHook( () => useSigPreview( true ) );

		await act( async () => {
			jest.runAllTimers();
		} );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'should debounce API calls when title changes', async () => {
		const { rerender } = renderHook( ( { enabled } ) => useSigPreview( enabled ), {
			initialProps: { enabled: true },
		} );

		// First render triggers immediate call (no previous title)
		await act( async () => {
			jest.runAllTimers();
		} );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );

		// Simulate title change
		useImageGeneratorConfig.mockReturnValue( {
			...mockImageGeneratorConfig,
			customText: 'Changed Text',
		} );

		rerender( { enabled: true } );

		// Should not call immediately due to debounce
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );

		// Fast-forward past debounce timer (1500ms)
		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	it( 'should clear timeout on unmount', async () => {
		const clearTimeoutSpy = jest.spyOn( globalThis, 'clearTimeout' );

		const { unmount } = renderHook( () => useSigPreview( true ) );

		unmount();

		expect( clearTimeoutSpy ).toHaveBeenCalled();
		clearTimeoutSpy.mockRestore();
	} );

	it( 'should return null URL when disabled even if previously had URL', async () => {
		const { result, rerender } = renderHook( ( { enabled } ) => useSigPreview( enabled ), {
			initialProps: { enabled: true },
		} );

		await act( async () => {
			jest.runAllTimers();
		} );

		await waitFor( () => {
			expect( result.current.url ).not.toBeNull();
		} );

		// Disable the hook
		rerender( { enabled: false } );

		expect( result.current.url ).toBeNull();
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'should use space as fallback when no title and no custom text', async () => {
		useImageGeneratorConfig.mockReturnValue( {
			...mockImageGeneratorConfig,
			customText: '',
		} );

		useSelect.mockReturnValue( {
			title: '',
			imageUrl: 'https://example.com/image.jpg',
		} );

		renderHook( () => useSigPreview( true ) );

		await act( async () => {
			jest.runAllTimers();
		} );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: expect.objectContaining( {
					text: ' ',
				} ),
			} )
		);
	} );
} );
