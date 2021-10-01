/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { ProductSuggestion } from '../index';
import { buildInitialState } from '../../product-suggestions/test/fixtures';
import analytics from 'lib/analytics';
import * as recommendationsActions from 'state/recommendations/actions';
import { fireEvent, render, screen } from 'test/test-utils';

describe( 'Recommendations – Product Suggestion Item', () => {
	const DUMMY_ACTION = { type: 'dummy' };
	const initialState = buildInitialState();
	// Backup Daily suggestion.
	const productSuggestion = initialState.jetpack.recommendations.productSuggestions[0];
	let updateRecommendationsStepStub,
		addSelectedRecommendationStub;

	before( function () {
		updateRecommendationsStepStub = sinon
			.stub( recommendationsActions, 'updateRecommendationsStep' )
			.returns( DUMMY_ACTION );
		addSelectedRecommendationStub = sinon
			.stub( recommendationsActions, 'addSelectedRecommendation' )
			.returns( DUMMY_ACTION );
	} );

	after( function () {
		updateRecommendationsStepStub.restore();
		addSelectedRecommendationStub.restore();
	} );

	it( 'shows the Product Suggestion components', () => {
		render( <ProductSuggestion product={ productSuggestion } />, {
			initialState: buildInitialState(),
		} );

		expect( screen.getAllByText( productSuggestion.title ) ).to.be.not.null;
		expect( screen.getAllByText( productSuggestion.description ) ).to.be.not.null;
		expect( screen.getAllByText( productSuggestion.cost ) ).to.be.not.null;
		expect( screen.getAllByText( 'Continue with ' + productSuggestion.title ) ).to.be.not.null;
		const externalLink = screen.getByRole( 'link', {
			name: productSuggestion.cta_text,
		} );
		expect( externalLink ).to.be.not.null;
		expect( externalLink.href ).to.have.string( productSuggestion.cta_link );
	} );

	it( 'track and save data when going to checkout', () => {
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <ProductSuggestion product={ productSuggestion } />, {
			initialState: buildInitialState(),
		} );

		const checkoutButton = screen.getByRole( 'link', {
			name: 'Continue with ' + productSuggestion.title,
		} );
		expect( checkoutButton ).to.be.not.null;

		expect( addSelectedRecommendationStub.callCount ).to.be.equal( 0 );

		// JSDom will complain about the page being redirect to wordpress.com/checkout/...
		// so we replace the href attribute of the HTML Element to something irrelevant.
		checkoutButton.href = '#test';
		fireEvent.click( checkoutButton );

		// Verify that tracking is working.
		expect(
			recordEventStub.withArgs(
				'jetpack_recommendations_product_suggestion_click',
				{ type: productSuggestion.slug },
			).callCount
		).to.be.equal( 1 );

		expect( addSelectedRecommendationStub.callCount ).to.be.equal( 1 );

		recordEventStub.restore();
	} );

	it( 'track external link click', () => {
		// Stub methods that perform side-effects through async actions
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <ProductSuggestion product={ productSuggestion } />, {
			initialState: buildInitialState(),
		} );

		// Find the skip link.
		const externalLink = screen.getByRole( 'link', {
			name: productSuggestion.cta_text,
		} );
		expect( externalLink ).to.be.not.null;

		// Execute click event.
		expect( recordEventStub.callCount ).to.be.equal( 0 );
		fireEvent.click( externalLink );

		// Verify that tracking is working.
		expect(
			recordEventStub.withArgs(
				'jetpack_recommendations_product_suggestion_learn_more_click',
				{ type: productSuggestion.slug },
			).callCount
		).to.be.equal( 1 );

		// Restore stubs.
		recordEventStub.restore();
	} );

} );
