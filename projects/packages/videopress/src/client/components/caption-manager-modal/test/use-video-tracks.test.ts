/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { fetchVideoItem } from '../../../lib/fetch-video-item';
import { flattenVideoTracks } from '../../../lib/video-tracks';
import { useVideoTracks } from '../use-video-tracks';
/**
 * Types
 */
import type { VideoTextTrack } from '../../../lib/video-tracks/types';
import type { ReactNode } from 'react';

jest.mock( 'debug', () => () => jest.fn() );
jest.mock( '../../../lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn(),
} ) );
jest.mock( '../../../lib/video-tracks', () => ( {
	flattenVideoTracks: jest.fn(),
} ) );

const fetchVideoItemMock = fetchVideoItem as jest.Mock;
const flattenVideoTracksMock = flattenVideoTracks as jest.Mock;

const track = ( srcLang: string ): VideoTextTrack => ( {
	kind: 'captions',
	srcLang,
	label: srcLang,
	src: `${ srcLang }.vtt`,
} );

const deferred = < T >() => {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason?: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
};

/**
 * Render the hook inside a fresh query client provider.
 *
 * @param props - Hook arguments.
 * @return The renderHook result.
 */
const renderVideoTracks = ( props: Parameters< typeof useVideoTracks >[ 0 ] ) => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
	} );
	return renderHook( () => useVideoTracks( props ), {
		wrapper: ( { children }: { children: ReactNode } ) =>
			createElement( QueryClientProvider, { client: queryClient }, children ),
	} );
};

describe( 'useVideoTracks', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		flattenVideoTracksMock.mockReturnValue( [ track( 'server' ) ] );
	} );

	it( 'replaces the managed tracks with the fetched video info on open', async () => {
		fetchVideoItemMock.mockResolvedValue( { tracks: {}, width: 1920, height: 1080 } );

		const { result } = renderVideoTracks( {
			guid: 'abc123',
			isOpen: true,
			tracks: [ track( 'prop' ) ],
		} );

		expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'prop' ] );
		await waitFor( () =>
			expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'server' ] )
		);
		expect( result.current.previewAspectRatio ).toBe( '1920 / 1080' );
	} );

	it( 'keeps the prop tracks when the video info carries none', async () => {
		fetchVideoItemMock.mockResolvedValue( { width: 1920, height: 1080 } );

		const { result } = renderVideoTracks( {
			guid: 'abc123',
			isOpen: true,
			tracks: [ track( 'prop' ) ],
		} );

		await waitFor( () => expect( result.current.previewAspectRatio ).toBe( '1920 / 1080' ) );
		expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'prop' ] );
	} );

	it( 'keeps an optimistic mutation over the response of an in-flight fetch', async () => {
		const fetch = deferred();
		fetchVideoItemMock.mockReturnValue( fetch.promise );

		const { result } = renderVideoTracks( {
			guid: 'abc123',
			isOpen: true,
			tracks: [ track( 'prop' ) ],
		} );

		act( () => result.current.setManagedTracks( [ track( 'local' ) ] ) );

		await act( async () => {
			fetch.resolve( { tracks: {}, width: 1920, height: 1080 } );
		} );

		await waitFor( () =>
			expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'local' ] )
		);
	} );

	it( 'keeps a local edit when the cancelled fetch rejects', async () => {
		const fetch = deferred();
		fetchVideoItemMock.mockReturnValue( fetch.promise );

		const { result } = renderVideoTracks( {
			guid: 'abc123',
			isOpen: true,
			tracks: [ track( 'prop' ) ],
		} );

		act( () => result.current.setManagedTracks( [ track( 'local' ) ] ) );

		await act( async () => {
			fetch.reject( new Error( 'network down' ) );
		} );

		await waitFor( () =>
			expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'local' ] )
		);
	} );

	it( 'reports a load failure when nothing was edited locally', async () => {
		const fetch = deferred();
		fetchVideoItemMock.mockReturnValue( fetch.promise );
		const onError = jest.fn();

		const { result } = renderVideoTracks( {
			guid: 'abc123',
			isOpen: true,
			tracks: [ track( 'prop' ) ],
			onError,
		} );

		await act( async () => {
			fetch.reject( new Error( 'network down' ) );
		} );

		await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'prop' ] );
	} );
} );
