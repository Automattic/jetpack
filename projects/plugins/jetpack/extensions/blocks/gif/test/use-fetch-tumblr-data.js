import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useFetchTumblrData from '../hooks/use-fetch-tumblr-data';

jest.mock( '@wordpress/api-fetch' );

const TUMBLR_RESPONSE = {
	meta: { status: 200, msg: 'OK' },
	response: {
		gifs: [
			{
				type: 'image',
				media: [
					{
						media_key: '3131b9d2a05485e7ae7838a8b1314ab2:2d72fb0f707ea67a-5f',
						type: 'image/gif',
						width: 500,
						height: 281,
						url: 'https://64.media.tumblr.com/3131b9d2a05485e7ae7838a8b1314ab2/2d72fb0f707ea67a-5f/s500x750/d45e10288e4ff6a775c879978f52c87d3318ff8d.gif',
					},
				],
				attribution: {
					type: 'post',
					url: 'https://www.tumblr.com/blog/view/everydayschristmas',
					blog: { name: 'everydayschristmas', url: 'everydayschristmas.tumblr.com' },
				},
			},
		],
	},
};

describe( 'useFetchTumblrData', () => {
	beforeEach( () => {
		apiFetch.mockResolvedValue( TUMBLR_RESPONSE );
	} );

	test( 'should return Tumblr GIF data after fetch', async () => {
		const { result } = renderHook( () => useFetchTumblrData() );

		await act( async () => {
			result.current.fetchTumblrData( '/some/api/endpoint' );
		} );

		expect( result.current.tumblrData ).toStrictEqual( TUMBLR_RESPONSE.response.gifs );
		expect( result.current.isFetching ).toBe( false );
	} );

	test( 'should not fetch if URL is falsy', async () => {
		const { result } = renderHook( () => useFetchTumblrData() );

		await act( async () => {
			result.current.fetchTumblrData( null );
		} );

		expect( result.current.tumblrData ).toStrictEqual( [] );
		expect( result.current.isFetching ).toBe( false );
	} );
} );
