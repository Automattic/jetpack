import { renderHook, waitFor } from '@testing-library/react';
import useProductInfo from '..';

jest.mock( '@wordpress/api-fetch', () => {
	return jest.fn( () => {
		return Promise.resolve( {
			social: {
				pricing_for_ui: {
					currency_code: 'USD',
					full_price: 120,
					introductory_offer: null,
				},
			},
		} );
	} );
} );

describe( 'useProductInfo', () => {
	it( 'should return the product info', async () => {
		const { result } = renderHook( () => useProductInfo() );

		await waitFor( () => {
			const [ productInfo ] = result.current;
			expect( productInfo ).toEqual( {
				currencyCode: 'USD',
				v1: {
					price: 10,
					introOffer: null,
				},
			} );
		} );
	} );
} );
