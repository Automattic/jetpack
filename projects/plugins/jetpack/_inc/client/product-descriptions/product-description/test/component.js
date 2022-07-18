import { jest } from '@jest/globals';
import analytics from 'lib/analytics';
import * as React from 'react';
import { getProductsForPurchase } from 'state/initial-state';
import { render, screen } from 'test/test-utils';
import ProductDescription from '../index';
import { buildInitialState } from './fixtures';

describe( 'Product Description', () => {
	const initialState = buildInitialState();
	const products = getProductsForPurchase( initialState );

	it( 'show product descriptions', () => {
		for ( const [ , product ] of Object.entries( products ) ) {
			render( <ProductDescription product={ product } />, {
				initialState: initialState,
			} );

			expect( screen.getAllByText( product.title ).length ).toBeGreaterThan( 0 );
			expect( screen.getAllByText( product.description ).length ).toBeGreaterThan( 0 );
		}
	} );

	it( 'track event - jetpack_product_description_view', () => {
		const product = products.backup;
		const recordEventStub = jest
			.spyOn( analytics.tracks, 'recordEvent' )
			.mockImplementation( () => {} );

		render( <ProductDescription product={ product } />, {
			initialState: initialState,
		} );

		expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_product_description_view', {
			type: product.slug,
		} );

		recordEventStub.mockRestore();
	} );
} );
