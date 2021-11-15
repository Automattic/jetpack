/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react-hooks';

/**
 * Internal dependencies
 */
import useTestPinterestEmbedUrl from '../hooks/use-test-pinterest-embed-url';
import testEmbedUrl from '../../../shared/test-embed-url';
import { PINTEREST_EXAMPLE_URL } from '../';

jest.mock( '../../../shared/test-embed-url', () => ( {
	__esModule: true,
	default: jest.fn().mockImplementation( ( url, setIsResolvingUrl = () => {} ) => {
		return new Promise( ( resolve, reject ) => {
			url === 'https://www.hello.com/is/it/me' ? reject() : resolve( url );
		} );
	} ),
} ) );

describe( 'useTestPinterestEmbedUrl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );
	test( 'should return resolved url for valid urls', async () => {
		const validUrl = 'https://www.pinterest.com.au/thebestpinterestuser';
		const { result } = renderHook(() =>
			useTestPinterestEmbedUrl()
		);

		await act( async () => {
			result.current.testUrl( validUrl );
		} );

		expect( testEmbedUrl ).toHaveBeenCalledWith( validUrl );
		expect( result.current.pinterestUrl ).toEqual( validUrl );
		expect( result.current.isFetching ).toBe( false );
		expect( result.current.hasTestUrlError ).toBe( false );
	} );

	test( 'should return provided url for invalid urls', async () => {
		const invalidUrl = 'https://www.hello.com/is/it/me';
		const { result } = renderHook(() =>
			useTestPinterestEmbedUrl()
		);

		await act( async () => {
			result.current.testUrl( invalidUrl );
		} );

		expect( testEmbedUrl ).toHaveBeenCalledWith( invalidUrl );
		expect( result.current.pinterestUrl ).toEqual( invalidUrl );
		expect( result.current.isFetching ).toBe( false );
		expect( result.current.hasTestUrlError ).toBe( true );
	} );

	test( 'should not call testEmbed url if the url is falsy', async () => {
		const invalidUrl = '';
		const { result } = renderHook(() =>
			useTestPinterestEmbedUrl()
		);

		await act( async () => {
			result.current.testUrl( invalidUrl );
		} );

		expect( testEmbedUrl ).not.toHaveBeenCalled();
	} );

	test( 'should not call testEmbed url if the url is the example url', async () => {
		const invalidUrl = '';
		const { result } = renderHook(() =>
			useTestPinterestEmbedUrl()
		);

		await act( async () => {
			result.current.testUrl( PINTEREST_EXAMPLE_URL );
		} );

		expect( testEmbedUrl ).not.toHaveBeenCalled();
	} );
} );
