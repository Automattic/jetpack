import analytics from '@automattic/jetpack-analytics';
import { renderHook, act } from '@testing-library/react';
import { makeLibraryItem } from '../../test-utils/library-item';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useSetPrivacy } from '../use-set-privacy';
import type { LibraryItem } from '../../types/library';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );
const recordEvent = analytics.tracks.recordEvent as jest.Mock;

describe( 'useSetPrivacy', () => {
	beforeEach( () => recordEvent.mockClear() );
	it( 'POSTs the mapped privacy_setting for each id', async () => {
		const requests: { id: number; privacy_setting: number }[] = [];
		mockApiFetch( async ( { path, method, data } ) => {
			if ( method === 'POST' && path === '/wpcom/v2/videopress/meta' ) {
				requests.push( data as { id: number; privacy_setting: number } );
				return { code: 'success' };
			}
			throw new Error( 'unexpected' );
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPrivacy(), { wrapper } );

		let outcome;
		await act( async () => {
			outcome = await result.current.mutateAsync( {
				items: [ makeLibraryItem( { id: '1' } ), makeLibraryItem( { id: '2' } ) ],
				privacy: 'private',
			} );
		} );

		expect( requests ).toEqual( [
			{ id: 1, privacy_setting: 1 },
			{ id: 2, privacy_setting: 1 },
		] );
		expect( outcome ).toEqual( { succeeded: [ '1', '2' ], failed: [] } );
		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_videopress_privacy_changed', { from: 'public', to: 'private', is_bulk: true } ],
			[ 'jetpack_videopress_privacy_changed', { from: 'public', to: 'private', is_bulk: true } ],
		] );
	} );

	it( 'reports partial failures without aborting the batch', async () => {
		mockApiFetch( async ( { method, data } ) => {
			if ( method === 'POST' ) {
				const { id } = data as { id: number };
				if ( id === 2 ) {
					throw new Error( 'nope' );
				}
				return { code: 'success' };
			}
			throw new Error( 'unexpected' );
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPrivacy(), { wrapper } );

		let outcome;
		await act( async () => {
			outcome = await result.current.mutateAsync( {
				items: [
					makeLibraryItem( { id: '1', privacy: 'private' } ),
					makeLibraryItem( { id: '2', privacy: 'private' } ),
					makeLibraryItem( { id: '3', privacy: 'site-default' } ),
				],
				privacy: 'public',
			} );
		} );

		expect( outcome ).toEqual( {
			succeeded: [ '1', '3' ],
			failed: [ { id: '2', message: 'nope' } ],
		} );
		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_videopress_privacy_changed', { from: 'private', to: 'public', is_bulk: true } ],
			[
				'jetpack_videopress_privacy_changed',
				{ from: 'site-default', to: 'public', is_bulk: true },
			],
		] );
	} );

	it( 'deduplicates the batch and records its original setting after acknowledgment and unmount', async () => {
		let resolveSave: ( value: unknown ) => void;
		const fetch = mockApiFetch(
			() =>
				new Promise( resolve => {
					resolveSave = resolve;
				} )
		);
		const video = makeLibraryItem( { privacy: 'public' } );
		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result, rerender, unmount } = renderHook( () => useSetPrivacy(), { wrapper } );
		let pending: ReturnType< typeof result.current.mutateAsync >;
		await act( async () => {
			pending = result.current.mutateAsync( { items: [ video, video ], privacy: 'private' } );
		} );
		rerender();
		expect( fetch ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).not.toHaveBeenCalled();
		video.privacy = 'site-default';
		unmount();
		await act( async () => {
			resolveSave( { code: 'success' } );
			await pending;
		} );
		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_videopress_privacy_changed', { from: 'public', to: 'private', is_bulk: false } ],
		] );
	} );

	it.each< [ string, LibraryItem, unknown ] >( [
		[ 'local video', makeLibraryItem( { type: 'local' } ), { code: 'success' } ],
		[ 'unchanged setting', makeLibraryItem( { privacy: 'private' } ), { code: 'success' } ],
		[ 'missing acknowledgment', makeLibraryItem(), {} ],
		[ 'null acknowledgment', makeLibraryItem(), null ],
		[ 'failed request', makeLibraryItem(), new Error( 'Failed' ) ],
	] )( 'does not record a privacy change for %s', async ( _label, video, response ) => {
		mockApiFetch( () => {
			if ( response instanceof Error ) {
				return Promise.reject( response );
			}
			return response;
		} );
		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => useSetPrivacy(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( { items: [ video ], privacy: 'private' } );
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );
} );
