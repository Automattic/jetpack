import { renderHook } from '@testing-library/react';
import { useAllProducts } from '../use-all-products';
import useProducts from '../use-products';
import type { ProductCamelCase } from '../../types';

jest.mock( '../use-all-products' );

type UseAllProductsReturn = ReturnType< typeof useAllProducts >;
const mockUseAllProducts = useAllProducts as jest.MockedFunction< typeof useAllProducts >;

const baseReturn: UseAllProductsReturn = {
	data: {},
	refetch: jest.fn().mockResolvedValue( { isError: false } ),
	isLoading: false,
	isRefetching: false,
	isError: false,
};

const mockReturn = ( overrides: Partial< UseAllProductsReturn > = {} ) =>
	mockUseAllProducts.mockReturnValue( { ...baseReturn, ...overrides } );

describe( 'useProducts', () => {
	const videopress = { slug: 'videopress', status: 'active' } as ProductCamelCase;
	const boost = { slug: 'boost', status: 'inactive' } as ProductCamelCase;
	const mockRefetch = jest.fn().mockResolvedValue( { isError: false } );

	beforeEach( () => {
		mockRefetch.mockClear();
		mockReturn( {
			data: { videopress, boost },
			refetch: mockRefetch,
		} );
	} );

	it( 'returns products matching the requested slugs from useAllProducts', () => {
		const { result } = renderHook( () => useProducts( [ 'videopress', 'boost' ] ) );

		expect( result.current.products ).toEqual( [ videopress, boost ] );
	} );

	it( 'accepts a single slug string', () => {
		const { result } = renderHook( () => useProducts( 'videopress' ) );

		expect( result.current.products ).toEqual( [ videopress ] );
	} );

	it( 'forwards loading and refetching flags from useAllProducts', () => {
		mockReturn( {
			refetch: mockRefetch,
			isLoading: true,
			isRefetching: true,
		} );

		const { result } = renderHook( () => useProducts( [ 'videopress' ] ) );

		expect( result.current.isLoading ).toBe( true );
		expect( result.current.isRefetching ).toBe( true );
	} );

	// Regression for MYJP-283: the previous `refetch` ran a separate
	// `useSimpleQuery` and wrote results into `window.myJetpackInitialState`,
	// bypassing the React Query cache that `useAllProducts` subscribes to —
	// so the UI never re-rendered after mutations. The fix delegates `refetch`
	// to `useAllProducts().refetch`, which invalidates the same cache entry
	// the UI reads from.
	it( 'delegates refetch() to useAllProducts().refetch', async () => {
		const { result } = renderHook( () => useProducts( [ 'videopress' ] ) );

		await result.current.refetch();

		expect( mockRefetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
