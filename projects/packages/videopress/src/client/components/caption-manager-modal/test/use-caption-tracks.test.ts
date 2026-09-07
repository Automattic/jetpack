/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { fetchCaptionTracks } from '../../../lib/video-tracks/caption-tracks';
import { useCaptionTracks } from '../use-caption-tracks';
/**
 * Types
 */
import type { SavedCaptionTrack } from '../../../lib/video-tracks/caption-tracks';
import type { ReactNode } from 'react';

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

/**
 * Render the hook inside a fresh query client provider.
 *
 * @param props - Hook arguments.
 * @return The renderHook result.
 */
const renderCaptionTracks = ( props: Parameters< typeof useCaptionTracks >[ 0 ] ) => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
	} );
	return renderHook( () => useCaptionTracks( props ), {
		wrapper: ( { children }: { children: ReactNode } ) =>
			createElement( QueryClientProvider, { client: queryClient }, children ),
	} );
};

describe( 'useCaptionTracks', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'loads caption tracks when the modal opens', async () => {
		fetchMock.mockResolvedValue( [ track( 1 ) ] );

		const { result } = renderCaptionTracks( { guid: 'abc123', isOpen: true } );

		await waitFor( () => expect( result.current.captionTracks ).toHaveLength( 1 ) );
		expect( fetchMock ).toHaveBeenCalledWith( 'abc123' );
		expect( result.current.isLoadingCaptionTracks ).toBe( false );
	} );

	it( 'does not fetch while the modal is closed', () => {
		fetchMock.mockResolvedValue( [ track( 1 ) ] );

		renderCaptionTracks( { guid: 'abc123', isOpen: false } );

		expect( fetchMock ).not.toHaveBeenCalled();
	} );

	it( 'keeps an optimistic write over the response of an in-flight fetch', async () => {
		const fetch = deferred< SavedCaptionTrack[] >();
		fetchMock.mockReturnValue( fetch.promise );

		const { result } = renderCaptionTracks( { guid: 'abc123', isOpen: true } );

		// A save lands before the open-fetch resolves; the fetch is cancelled.
		act( () => result.current.setCaptionTracks( [ track( 77 ) ] ) );

		await act( async () => {
			fetch.resolve( [ track( 1 ), track( 2 ) ] );
		} );

		await waitFor( () =>
			expect( result.current.captionTracks.map( saved => saved.id ) ).toEqual( [ 77 ] )
		);
	} );

	it( 'keeps the edited list when the cancelled fetch rejects, without a spurious error', async () => {
		const fetch = deferred< SavedCaptionTrack[] >();
		fetchMock.mockReturnValue( fetch.promise );
		const onError = jest.fn();

		const { result } = renderCaptionTracks( { guid: 'abc123', isOpen: true, onError } );

		act( () => result.current.setCaptionTracks( [ track( 77 ) ] ) );

		await act( async () => {
			fetch.reject( new Error( 'network down' ) );
		} );

		await waitFor( () =>
			expect( result.current.captionTracks.map( saved => saved.id ) ).toEqual( [ 77 ] )
		);
		expect( onError ).not.toHaveBeenCalled();
	} );

	it( 'reports the failure and stays empty when there are no local edits', async () => {
		const fetch = deferred< SavedCaptionTrack[] >();
		fetchMock.mockReturnValue( fetch.promise );
		const onError = jest.fn();

		const { result } = renderCaptionTracks( { guid: 'abc123', isOpen: true, onError } );

		await act( async () => {
			fetch.reject( new Error( 'network down' ) );
		} );

		await waitFor( () => expect( onError ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current.captionTracks ).toEqual( [] );
	} );
} );
