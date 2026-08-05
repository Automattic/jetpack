import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { usePosterUrl, usePlaybackToken } from '../use-poster-url';
import type { LibraryItem } from '../../types/library';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

const baseVideo: LibraryItem = {
	id: '42',
	guid: 'abc123',
	type: 'videopress',
	title: 'My video',
	filename: 'movie.mp4',
	thumbnailUrl: 'https://example.test/poster.jpg',
	durationSeconds: 60,
	uploadDate: '2026-01-01T00:00:00',
	privacy: 'public',
	isPrivate: false,
	fileSizeBytes: 0,
	upload: { status: 'idle', progress: 0 },
	description: '',
	rating: 'G',
	displayEmbed: true,
	allowDownloads: false,
	shortcode: '[videopress abc123]',
	sourceUrl: 'https://example.test/movie.mp4',
	isProcessing: false,
	orientation: null,
	tracks: [],
};

/**
 * Create an isolated QueryClient and a React wrapper component for renderHook.
 *
 * @return An object containing the client and wrapper component.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper };
}

afterEach( () => {
	mockedApiFetch.mockReset();
} );

describe( 'usePosterUrl', () => {
	it( 'public video: returns the thumbnail URL as-is without minting a token', () => {
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => usePosterUrl( baseVideo ), { wrapper } );

		expect( result.current ).toBe( 'https://example.test/poster.jpg' );
		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'returns null when the video has no thumbnail', () => {
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => usePosterUrl( { ...baseVideo, thumbnailUrl: null } ), {
			wrapper,
		} );

		expect( result.current ).toBeNull();
	} );

	it( 'private video: returns null while the token is in flight, then the signed URL', async () => {
		mockedApiFetch.mockResolvedValueOnce( { playback_token: 'tok-1' } );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => usePosterUrl( { ...baseVideo, isPrivate: true } ), {
			wrapper,
		} );

		expect( result.current ).toBeNull();

		await waitFor( () =>
			expect( result.current ).toBe( 'https://example.test/poster.jpg?metadata_token=tok-1' )
		);
		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/playback-jwt/abc123',
			method: 'POST',
		} );
	} );

	it( 'private video: stays null when the response carries no playback token', async () => {
		mockedApiFetch.mockResolvedValueOnce( {} );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => usePosterUrl( { ...baseVideo, isPrivate: true } ), {
			wrapper,
		} );

		await waitFor( () => expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current ).toBeNull();
	} );
} );

describe( 'usePlaybackToken', () => {
	it( 'skips the request when disabled or without a guid', () => {
		const { wrapper } = makeWrapper();
		const { result: disabled } = renderHook( () => usePlaybackToken( 'abc123', false ), {
			wrapper,
		} );
		const { result: noGuid } = renderHook( () => usePlaybackToken( '', true ), { wrapper } );

		expect( disabled.current ).toBeUndefined();
		expect( noGuid.current ).toBeUndefined();
		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shares one request per guid across concurrent renders', async () => {
		mockedApiFetch.mockResolvedValue( { playback_token: 'tok-1' } );
		const { wrapper } = makeWrapper();
		const { result: first } = renderHook( () => usePlaybackToken( 'abc123', true ), { wrapper } );
		const { result: second } = renderHook( () => usePlaybackToken( 'abc123', true ), { wrapper } );

		await waitFor( () => expect( first.current ).toBe( 'tok-1' ) );
		await waitFor( () => expect( second.current ).toBe( 'tok-1' ) );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
