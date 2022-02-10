/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { ProductPurchased } from '../index';
import { buildInitialState, sitePurchases } from '../../prompts/product-suggestions/test/fixtures';
import analytics from 'lib/analytics';
import { render, screen } from 'test/test-utils';

describe( 'Recommendations – Product Purchased', () => {
	const initialState = buildInitialState();
	// Populate data with mock purchases.
	initialState.jetpack.siteData.data.sitePurchases = sitePurchases();
	// Backup Daily suggestion.
	const productSuggestion = initialState.jetpack.recommendations.productSuggestions[0];

	it( 'shows the Product Purchased component', () => {
		render( <ProductPurchased />, {
			initialState: initialState,
		} );

		// Shows static data.
		expect( screen.getAllByText( 'Your plan has been upgraded!' ) ).to.be.not.null;
		expect( screen.getAllByText( 'You now have access to these benefits:' ) ).to.be.not.null;

		// Shows dynamic features checkboxes.
		productSuggestion.features.map( ( feature ) => {
			expect( screen.getAllByText( feature ) ).to.be.not.null;
		} );
	} );

	it( 'track landing on the purchase step', () => {
		// Stub methods that perform side-effects through async actions
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <ProductPurchased />, {
			initialState: initialState,
		} );

		// Verify that tracking is working.
		expect(
			recordEventStub.withArgs(
				'jetpack_recommendations_product_suggestion_purchased',
				{ type: productSuggestion.slug }
			).callCount
		).to.be.equal( 1 );

		// Restore stubs.
		recordEventStub.restore();
	} );

} );
