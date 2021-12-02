/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { ProductSuggestions } from '../index';
import { buildInitialState } from './fixtures';
import analytics from 'lib/analytics';
import * as recommendationsActions from 'state/recommendations/actions';
import { fireEvent, render, screen } from 'test/test-utils';

describe( 'Recommendations – Product Suggestions', () => {
	const DUMMY_ACTION = { type: 'dummy' };
	let updateRecommendationsStepStub,
		addSkippedRecommendationStub;

	before( function () {
		updateRecommendationsStepStub = sinon
			.stub( recommendationsActions, 'updateRecommendationsStep' )
			.returns( DUMMY_ACTION );
		addSkippedRecommendationStub = sinon
			.stub( recommendationsActions, 'addSkippedRecommendation' )
			.returns( DUMMY_ACTION );
	} );

	after( function () {
		updateRecommendationsStepStub.restore();
		addSkippedRecommendationStub.restore();
	} );

	it( 'shows the Product Suggestions component', () => {
		render( <ProductSuggestions />, {
			initialState: buildInitialState(),
		} );

		// Make sure we display all static data.
		expect( screen.getAllByText( 'Choose a plan' ) ).to.be.not.null;
		expect( screen.getAllByText( 'These are the most popular Jetpack plans for sites like yours:' ) ).to.be.not.null;
		expect( screen.getAllByText( '14-day money-back guarantee' ) ).to.be.not.null;
		expect( screen.getAllByText( 'Decide later' ) ).to.be.not.null;

		// Verify that we display both recommendations.
		expect( screen.getAllByText( 'Backup Daily' ) ).to.be.not.null;
		expect( screen.getAllByText( 'Security Daily' ) ).to.be.not.null;
	} );

	it( 'calls the right actions when a user clicks on the skip link', () => {
		// Stub methods that perform side-effects through async actions
		const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );

		render( <ProductSuggestions />, {
			initialState: buildInitialState(),
		} );

		// Find the skip link.
		const skipLink = screen.getByRole( 'link', {
			name: /Decide Later/i,
		} );
		expect( skipLink ).to.be.not.null;

		// Execute click event.
		expect( recordEventStub.callCount ).to.be.equal( 0 );
		fireEvent.click( skipLink );

		// Verify that tracking is working.
		expect( recordEventStub.withArgs( 'jetpack_recommendations_product_suggestions_decide_later_click' ).callCount ).to.be.equal( 1 );

		// Make sure addSkippedRecommendation action is called with the right step slug.
		expect( addSkippedRecommendationStub.withArgs( 'product-suggestions' ).callCount ).to.be.equal( 1 );

		// Restore stubs.
		recordEventStub.restore();
	} );

} );
