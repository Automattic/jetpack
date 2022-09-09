import { jest } from '@jest/globals';
import analytics from 'lib/analytics';
import * as React from 'react';
import { render, screen } from 'test/test-utils';
import { buildInitialState, sitePurchases } from '../../prompts/product-suggestions/test/fixtures';
import { ProductPurchased } from '../index';

describe( 'Recommendations – Product Purchased', () => {
	const initialState = buildInitialState();
	// Populate data with mock purchases.
	initialState.jetpack.siteData.data.sitePurchases = sitePurchases();
	// Backup Daily suggestion.
	const productSuggestion = initialState.jetpack.recommendations.productSuggestions[ 0 ];

	it( 'shows the Product Purchased component', () => {
		render( <ProductPurchased />, {
			initialState: initialState,
		} );

		// Shows static data.
		expect( screen.getByText( 'Your plan has been upgraded!' ) ).toBeInTheDocument();
		expect( screen.getByText( 'You now have access to these benefits:' ) ).toBeInTheDocument();

		// Shows dynamic features checkboxes.
		productSuggestion.features.map( feature => {
			expect( screen.getByText( feature ) ).toBeInTheDocument();
		} );
	} );

	it( 'track landing on the purchase step', () => {
		// Stub methods that perform side-effects through async actions
		const recordEventStub = jest
			.spyOn( analytics.tracks, 'recordEvent' )
			.mockImplementation( () => {} );

		render( <ProductPurchased />, {
			initialState: initialState,
		} );

		// Verify that tracking is working.
		expect( recordEventStub ).toHaveBeenCalledWith(
			'jetpack_recommendations_product_suggestion_purchased',
			{
				type: productSuggestion.slug,
			}
		);

		// Restore stubs.
		recordEventStub.mockRestore();
	} );
} );
