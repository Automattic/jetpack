import { renderHook, act } from '@testing-library/react-hooks';
import useFetchGiphyData from '../hooks/use-fetch-giphy-data';

const originalFetch = window.fetch;

const GIPHY_SINGLE_RESPONSE = {
	data: {
		id: '9',
		embed_url: 'pony',
		images: {
			downsized_still: {
				url: 'chips',
			},
			original: {
				height: 10,
				width: 10,
			},
		},
	},
};

const GIPHY_MULTIPLE_RESPONSE = {
	data: [
		{
			id: '9',
			embed_url: 'pony',
			images: {
				downsized_still: {
					url: 'chips',
				},
				original: {
					height: 10,
					width: 10,
				},
			},
		},
		{
			id: '99',
			embed_url: 'horsey',
			images: {
				downsized_still: {
					url: 'fish',
				},
				original: {
					height: 12,
					width: 12,
				},
			},
		},
	],
};

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @param {*} resolvedFetchPromiseResponse - JSON return value.
 * @returns {Promise} Mock return value.
 */
function getFetchMockReturnValue( resolvedFetchPromiseResponse ) {
	const resolvedFetchPromise = Promise.resolve( resolvedFetchPromiseResponse );
	return Promise.resolve( {
		ok: true,
		json: () => resolvedFetchPromise,
	} );
}

describe( 'useFetchGiphyData', () => {
	beforeEach( () => {
		// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
		window.fetch = jest.fn();
		window.fetch.mockReturnValue( getFetchMockReturnValue( GIPHY_SINGLE_RESPONSE ) );
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	test( 'should return object response data after fetch', async () => {
		const { result } = renderHook( () => useFetchGiphyData() );

		await act( async () => {
			result.current.fetchGiphyData( 'https://icantbelieve.its/not/butter' );
		} );

		expect( result.current.giphyData ).toStrictEqual( [ GIPHY_SINGLE_RESPONSE.data ] );

		expect( result.current.isFetching ).toBe( false );
	} );

	test( 'should return array data after fetch', async () => {
		window.fetch.mockReturnValueOnce( getFetchMockReturnValue( GIPHY_MULTIPLE_RESPONSE ) );

		const { result } = renderHook( () => useFetchGiphyData() );

		await act( async () => {
			result.current.fetchGiphyData( 'https://icantbelieve.its/not/butter' );
		} );

		expect( result.current.giphyData ).toStrictEqual( GIPHY_MULTIPLE_RESPONSE.data );

		expect( result.current.isFetching ).toBe( false );
	} );

	test( 'should not fetch if url is falsy', async () => {
		const { result } = renderHook( () => useFetchGiphyData() );

		await act( async () => {
			result.current.fetchGiphyData( null );
		} );

		expect( result.current.giphyData ).toStrictEqual( [] );

		expect( result.current.isFetching ).toBe( false );
	} );
} );
