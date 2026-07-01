/**
 * External dependencies
 */
import { act, renderHook, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { fetchCaptionTracks } from '../../../lib/video-tracks/caption-tracks';
import { useCaptionTracks } from '../use-caption-tracks';
/**
 * Types
 */
import type { SavedCaptionTrack } from '../../../lib/video-tracks/caption-tracks';

jest.mock( 'debug', () => () => jest.fn() );
jest.mock( '../../../lib/video-tracks/caption-tracks', () => ( {
	fetchCaptionTracks: jest.fn(),
} ) );

const fetchMock = fetchCaptionTracks as jest.Mock;

const track = ( id: number ): SavedCaptionTrack => ( {
	id,
	title: `Track ${ id }`,
	content: '',
	status: 'draft',
	meta: {} as SavedCaptionTrack[ 'meta' ],
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

describe( 'useCaptionTracks', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'loads caption tracks when the modal opens', async () => {
		fetchMock.mockResolvedValue( [ track( 1 ) ] );

		const { result } = renderHook( () => useCaptionTracks( { guid: 'abc123', isOpen: true } ) );

		await waitFor( () => expect( result.current.captionTracks ).toHaveLength( 1 ) );
		expect( fetchMock ).toHaveBeenCalledWith( 'abc123' );
		expect( result.current.isLoadingCaptionTracks ).toBe( false );
	} );

	it( 'keeps an optimistic save and merges the server drafts in behind it', async () => {
		const fetch = deferred< SavedCaptionTrack[] >();
		fetchMock.mockReturnValue( fetch.promise );

		const { result } = renderHook( () => useCaptionTracks( { guid: 'abc123', isOpen: true } ) );

		// A save lands before the open-fetch resolves.
		act( () => result.current.setCaptionTracks( [ track( 77 ) ] ) );

		await act( async () => {
			fetch.resolve( [ track( 1 ), track( 2 ) ] );
		} );

		expect( result.current.captionTracks.map( saved => saved.id ) ).toEqual( [ 77, 1, 2 ] );
	} );

	it( 'reports a load failure after a local edit without wiping the edited list', async () => {
		const fetch = deferred< SavedCaptionTrack[] >();
		fetchMock.mockReturnValue( fetch.promise );
		const onError = jest.fn();

		const { result } = renderHook( () =>
			useCaptionTracks( { guid: 'abc123', isOpen: true, onError } )
		);

		act( () => result.current.setCaptionTracks( [ track( 77 ) ] ) );

		await act( async () => {
			fetch.reject( new Error( 'network down' ) );
		} );

		await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current.captionTracks.map( saved => saved.id ) ).toEqual( [ 77 ] );
	} );

	it( 'empties the list and reports the failure when there are no local edits', async () => {
		const fetch = deferred< SavedCaptionTrack[] >();
		fetchMock.mockReturnValue( fetch.promise );
		const onError = jest.fn();

		const { result } = renderHook( () =>
			useCaptionTracks( { guid: 'abc123', isOpen: true, onError } )
		);

		await act( async () => {
			fetch.reject( new Error( 'network down' ) );
		} );

		await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current.captionTracks ).toEqual( [] );
	} );
} );
