import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import * as React from 'react';
import * as recommendationsActions from 'state/recommendations/actions';
import { render, screen } from 'test/test-utils';
import { buildInitialState } from '../../product-suggestions/test/fixtures';
import { ProductSuggestion } from '../index';

describe( 'Recommendations – Product Suggestion Item', () => {
	const DUMMY_ACTION = { type: 'dummy' };
	const initialState = buildInitialState();
	// Backup Daily suggestion.
	const productSuggestion = initialState.jetpack.recommendations.productSuggestions[ 0 ];
	let updateRecommendationsStepStub, addSelectedRecommendationStub;

	beforeAll( () => {
		updateRecommendationsStepStub = jest
			.spyOn( recommendationsActions, 'updateRecommendationsStep' )
			.mockReturnValue( DUMMY_ACTION );
		addSelectedRecommendationStub = jest
			.spyOn( recommendationsActions, 'addSelectedRecommendation' )
			.mockReturnValue( DUMMY_ACTION );
	} );

	afterAll( () => {
		updateRecommendationsStepStub.mockRestore();
		addSelectedRecommendationStub.mockRestore();
	} );

	it( 'shows the Product Suggestion components', () => {
		render( <ProductSuggestion product={ productSuggestion } />, {
			initialState: buildInitialState(),
		} );

		expect( screen.getByText( productSuggestion.title ) ).toBeInTheDocument();
		expect( screen.getByText( productSuggestion.description ) ).toBeInTheDocument();
		expect( screen.getByText( 'Get ' + productSuggestion.title ) ).toBeInTheDocument();
	} );

	it( 'track and save data when going to checkout', async () => {
		const user = userEvent.setup();

		const recordEventStub = jest
			.spyOn( analytics.tracks, 'recordEvent' )
			.mockImplementation( () => {} );

		render( <ProductSuggestion product={ productSuggestion } />, {
			initialState: buildInitialState(),
		} );

		const checkoutButton = screen.getByRole( 'link', {
			name: 'Get ' + productSuggestion.title,
		} );
		expect( checkoutButton ).toBeInTheDocument();

		expect( addSelectedRecommendationStub ).not.toHaveBeenCalled();

		// JSDom will complain about the page being redirect to wordpress.com/checkout/...
		// so we replace the href attribute of the HTML Element to something irrelevant.
		checkoutButton.href = '#test';
		await user.click( checkoutButton );

		// Verify that tracking is working.
		expect( recordEventStub ).toHaveBeenCalledWith(
			'jetpack_recommendations_product_suggestion_click',
			{
				product_slug: productSuggestion.slug,
				discount: false,
			}
		);

		expect( addSelectedRecommendationStub ).toHaveBeenCalledTimes( 1 );

		recordEventStub.mockRestore();
	} );
} );
