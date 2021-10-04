/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import ProductDescription from '../index';
import { getProductsForPurchase } from 'state/initial-state';
import { buildInitialState } from './fixtures';
import analytics from 'lib/analytics';
import { render, screen } from 'test/test-utils';

describe( 'Product Description', () => {
	const initialState = buildInitialState();
	const products = getProductsForPurchase( initialState );

	it( 'show product descriptions', () => {
		for ( const [ key, product ] of Object.entries( products ) ) {
			render( <ProductDescription product={ product }/>, {
				initialState: initialState,
			} );

			expect( screen.getAllByText( product.title ) ).to.exist;
			expect( screen.getAllByText( product.description ) ).to.exist;
		}
	} );

	it( 'track event - jetpack_product_description_view', () => {
		const product = products.backup;
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <ProductDescription product={ product }/>, {
			initialState: initialState,
		} );

		expect(
			recordEventStub.withArgs(
				'jetpack_product_description_view',
				{ type: product.slug },
			).callCount
		).to.be.equal( 1 );

		recordEventStub.restore();
	} );

} );
