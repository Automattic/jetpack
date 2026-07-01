/**
 * External dependencies
 */
import { act, renderHook, waitFor } from '@testing-library/react';
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

describe( 'useVideoTracks', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		flattenVideoTracksMock.mockReturnValue( [ track( 'server' ) ] );
	} );

	it( 'replaces the managed tracks with the fetched video info on open', async () => {
		fetchVideoItemMock.mockResolvedValue( { tracks: {}, width: 1920, height: 1080 } );

		const { result } = renderHook( () =>
			useVideoTracks( { guid: 'abc123', isOpen: true, tracks: [ track( 'prop' ) ] } )
		);

		await waitFor( () =>
			expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'server' ] )
		);
		expect( result.current.previewAspectRatio ).toBe( '1920 / 1080' );
	} );

	it( 'keeps an optimistic mutation that landed before the fetch resolved', async () => {
		const fetch = deferred();
		fetchVideoItemMock.mockReturnValue( fetch.promise );

		const { result } = renderHook( () =>
			useVideoTracks( { guid: 'abc123', isOpen: true, tracks: [ track( 'prop' ) ] } )
		);

		act( () => result.current.setManagedTracks( [ track( 'local' ) ] ) );

		await act( async () => {
			fetch.resolve( { tracks: {}, width: 1920, height: 1080 } );
		} );

		expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'local' ] );
	} );

	it( 'reports a load failure even after a local edit', async () => {
		const fetch = deferred();
		fetchVideoItemMock.mockReturnValue( fetch.promise );
		const onError = jest.fn();

		const { result } = renderHook( () =>
			useVideoTracks( { guid: 'abc123', isOpen: true, tracks: [ track( 'prop' ) ], onError } )
		);

		act( () => result.current.setManagedTracks( [ track( 'local' ) ] ) );

		await act( async () => {
			fetch.reject( new Error( 'network down' ) );
		} );

		await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current.managedTracks.map( t => t.srcLang ) ).toEqual( [ 'local' ] );
	} );
} );
