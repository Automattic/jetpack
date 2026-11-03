import analytics from '@automattic/jetpack-analytics';
import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
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

	it.each< [ string, LibraryItemPrivacy | undefined, LibraryItemPrivacy | undefined, unknown ] >( [
		[ 'no previous value', undefined, 'private', { code: 'success' } ],
		[ 'unrelated edit', 'public', undefined, { code: 'success' } ],
		[ 'unchanged value', 'private', 'private', { code: 'success' } ],
		[ 'missing acknowledgment', 'public', 'private', {} ],
		[ 'null acknowledgment', 'public', 'private', null ],
		[ 'error response', 'public', 'private', { code: 'error' } ],
		[ 'rejected request', 'public', 'private', new Error( 'Failed' ) ],
	] )(
		'does not record a privacy change for %s',
		async ( _label, previousPrivacy, privacy, response ) => {
			mockApiFetch( () => {
				if ( response instanceof Error ) {
					return Promise.reject( response );
				}
				return response;
			} );
			const wrapper = createTestWrapper( createTestQueryClient() );
			const { result } = renderHook( () => useUpdateVideoMeta(), { wrapper } );
			await act( async () => {
				const pending = result.current.mutateAsync( {
					id: 42,
					patch: { title: 'Edited', privacy },
					previousPrivacy,
				} );
			const failure = await pending.catch( ( error: unknown ) => error );
			expect( failure ).toBe( response instanceof Error ? response : undefined );
			} );
			expect( recordEvent ).not.toHaveBeenCalled();
		}
	);

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
