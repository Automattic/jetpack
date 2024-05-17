import { renderHook, waitFor } from '@testing-library/react';
import useProductInfo from '..';

jest.mock( '@wordpress/api-fetch', () => {
	return jest.fn( () => {
		return Promise.resolve( {
			basic: {
				currency_code: 'USD',
				cost: 120,
				introductory_offer: null,
			},
			advanced: {
				currency_code: 'USD',
				cost: 240,
				introductory_offer: {
					cost_per_interval: 720,
					interval_count: 1,
					interval_unit: 'month',
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
				basic: {
					price: 10,
					introOffer: null,
				},
				advanced: {
					price: 20,
					introOffer: 60,
				},
			} );
		} );
	} );
} );
