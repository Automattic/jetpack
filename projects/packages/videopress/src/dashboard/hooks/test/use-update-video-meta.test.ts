import analytics from '@automattic/jetpack-analytics';
import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { VideoMetaSaveError } from '../../utils/video-meta-request';
import { useUpdateVideoMeta, patchToApi } from '../use-update-video-meta';
import type { LibraryItemPrivacy } from '../../types/library';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );
const recordEvent = analytics.tracks.recordEvent as jest.Mock;

describe( 'patchToApi', () => {
	it( 'maps UI fields to wpcom/v2/videopress/meta shape', () => {
		expect(
			patchToApi( {
				title: 'New',
				description: 'd',
				rating: 'PG-13',
				privacy: 'private',
				displayEmbed: true,
				allowDownloads: false,
			} )
		).toEqual( {
			title: 'New',
			description: 'd',
			rating: 'PG-13',
			privacy_setting: 1,
			display_embed: true,
			allow_download: false,
		} );
	} );

	it( 'omits keys not in the patch', () => {
		expect( patchToApi( { title: 'Only' } ) ).toEqual( { title: 'Only' } );
	} );
} );

describe( 'useUpdateVideoMeta', () => {
	beforeEach( () => recordEvent.mockClear() );
	it( 'POSTs to wpcom/v2/videopress/meta with id and the converted patch', async () => {
		let capturedData: unknown;
		mockApiFetch( async ( { path, method, data } ) => {
			if ( path === '/wpcom/v2/videopress/meta' && method === 'POST' ) {
				capturedData = data;
				return { code: 'success', message: 'ok', data: 200 };
			}
			throw new Error( `unexpected: ${ path } ${ method }` );
		} );

		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useUpdateVideoMeta(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( {
				id: 42,
				patch: { title: 'X', displayEmbed: true, privacy: 'private' },
				previousPrivacy: 'public',
			} );
		} );

		expect( capturedData ).toEqual( {
			id: 42,
			title: 'X',
			display_embed: true,
			privacy_setting: 1,
		} );
		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_videopress_privacy_changed', { from: 'public', to: 'private', is_bulk: false } ],
		] );
	} );

	it.each< [ string, LibraryItemPrivacy | undefined, LibraryItemPrivacy | undefined ] >( [
		[ 'no previous value', undefined, 'private' ],
		[ 'unrelated edit', 'public', undefined ],
		[ 'unchanged value', 'private', 'private' ],
	] )( 'does not record a privacy change for %s', async ( _label, previousPrivacy, privacy ) => {
		mockApiFetch( () => ( { code: 'success' } ) );
		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useUpdateVideoMeta(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( {
				id: 42,
				patch: { title: 'Edited', privacy },
				previousPrivacy,
			} );
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it.each< [ string, unknown, string, number | undefined ] >( [
		[ 'an empty 2xx body', {}, 'unacknowledged', undefined ],
		[ 'a null 2xx body', null, 'unacknowledged', undefined ],
		[ 'an error sent as 2xx', { code: 'error', message: 'Nope' }, 'error', undefined ],
		[
			'a REST error',
			Object.assign( new Error( 'No route' ), {
				code: 'rest_no_route',
				data: { status: 404 },
			} ),
			'rest_no_route',
			404,
		],
		[
			'a non-JSON reply',
			{ code: 'invalid_json', message: 'Not JSON' },
			'invalid_json',
			undefined,
		],
	] )( 'rejects, logs and records nothing for %s', async ( _label, response, code, status ) => {
		mockApiFetch( () =>
			response instanceof Error || ( response as { code?: string } )?.code === 'invalid_json'
				? Promise.reject( response )
				: response
		);
		const client = createTestQueryClient();
		const invalidate = jest.spyOn( client, 'invalidateQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useUpdateVideoMeta(), { wrapper } );
		let failure: unknown;
		await act( async () => {
			failure = await result.current
				.mutateAsync( {
					id: 42,
					patch: { title: 'Edited', privacy: 'private' },
					previousPrivacy: 'public',
				} )
				.catch( ( error: unknown ) => error );
		} );
		expect( failure ).toBeInstanceOf( VideoMetaSaveError );
		expect( failure ).toMatchObject( { code, status } );
		expect( console ).toHaveErroredWith( 'VideoPress: video details were not saved.', {
			id: 42,
			status,
			code,
			message: ( failure as Error ).message,
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
		expect( invalidate ).not.toHaveBeenCalled();
	} );

	it( 'records the submitted setting only after acknowledgment, including after unmount', async () => {
		let resolveSave: ( value: unknown ) => void;
		mockApiFetch(
			() =>
				new Promise( resolve => {
					resolveSave = resolve;
				} )
		);
		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result, rerender, unmount } = renderHook( () => useUpdateVideoMeta(), { wrapper } );
		const patch = { privacy: 'site-default' as LibraryItemPrivacy };
		let pending: Promise< void >;
		await act( async () => {
			pending = result.current.mutateAsync( { id: 42, patch, previousPrivacy: 'private' } );
		} );
		rerender();
		expect( recordEvent ).not.toHaveBeenCalled();
		patch.privacy = 'public';
		unmount();
		await act( async () => {
			resolveSave( { code: 'success' } );
			await pending;
		} );
		expect( recordEvent.mock.calls ).toEqual( [
			[
				'jetpack_videopress_privacy_changed',
				{ from: 'private', to: 'site-default', is_bulk: false },
			],
		] );
	} );
} );
