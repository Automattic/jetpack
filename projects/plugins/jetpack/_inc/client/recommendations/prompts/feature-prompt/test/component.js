/**
 * External dependencies
 */
import * as React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import * as featureUtils from '../../../feature-utils';
import { FeaturePrompt } from '../index';
import analytics from 'lib/analytics';
import * as recommendationsActions from 'state/recommendations/actions';
import { fireEvent, render, screen } from 'test/test-utils';

function buildInitialState( { recommendationsStep } = {} ) {
	return {
		jetpack: {
			initialState: {
				siteTitle: 'Test Site',
			},
			pluginsData: {
				items: {
					'jetpack/jetpack.php': {
						active: true,
					},
				},
			},
			recommendations: {
				data: {},
				step: recommendationsStep,
			},
			settings: {
				items: [],
			},
		},
	};
}

describe( 'Recommendations – Feature Prompt', () => {
	const DUMMY_ACTION = { type: 'dummy' };
	let updateRecommendationsStepStub;

	before( function () {
		updateRecommendationsStepStub = sinon
			.stub( recommendationsActions, 'updateRecommendationsStep' )
			.returns( DUMMY_ACTION );
	} );

	after( function () {
		updateRecommendationsStepStub.restore();
	} );

	describe( 'Monitor', () => {
		const stepSlug = 'monitor';

		it( 'shows the title of the Feature Prompt component', () => {
			render( <FeaturePrompt stepSlug={ stepSlug } />, {
				initialState: buildInitialState( { recommendationsStep: stepSlug } ),
			} );
			expect(
				screen.getByRole( 'heading', {
					name: /Would you like Downtime Monitoring to notify you if your site goes offline?/i,
				} )
			).to.be.not.null;
		} );

		it( 'shows the enable and skip feature buttons', () => {
			render( <FeaturePrompt stepSlug={ stepSlug } />, {
				initialState: buildInitialState( { recommendationsStep: stepSlug } ),
			} );

			expect(
				screen.getByRole( 'link', {
					name: /Enable Downtime Monitoring/i,
				} )
			).to.be.not.null;

			expect(
				screen.getByRole( 'link', {
					name: /Not now/i,
				} )
			).to.be.not.null;
		} );

		it( 'calls the right actions when a user clicks on the enable feature button', () => {
			// Stub methods that perform side-effects through async actions
			const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );
			const addSelectedRecommendationStub = sinon
				.stub( recommendationsActions, 'addSelectedRecommendation' )
				.returns( DUMMY_ACTION );
			const activateFeatureStub = sinon.stub().returns( DUMMY_ACTION );
			const mapDispatchToPropsStub = sinon.stub( featureUtils, 'mapDispatchToProps' ).returns( {
				activateFeature: activateFeatureStub,
			} );

			render( <FeaturePrompt stepSlug={ stepSlug } />, {
				initialState: buildInitialState( { recommendationsStep: stepSlug } ),
			} );

			const enableFeatureButton = screen.getByRole( 'link', {
				name: /Enable Downtime Monitoring/i,
			} );
			expect( enableFeatureButton ).to.be.not.null;

			// Make sure the enable button points to the right link
			expect( enableFeatureButton.href ).to.have.string( 'recommendations/related-posts' );

			expect( recordEventStub.callCount ).to.be.equal( 0 );
			fireEvent.click( enableFeatureButton );

			// Make sure tracks work
			expect(
				recordEventStub.withArgs( 'jetpack_recommended_feature_enable_click', {
					feature: stepSlug,
				} ).callCount
			).to.be.equal( 1 );

			// Make sure addSelectedRecommendation action is called with the right step slug
			expect( addSelectedRecommendationStub.withArgs( stepSlug ).callCount ).to.be.equal( 1 );

			// Make sure activateFeature action is called
			expect( activateFeatureStub.callCount ).to.be.equal( 1 );

			// Restore stubs
			recordEventStub.restore();
			addSelectedRecommendationStub.restore();
			mapDispatchToPropsStub.restore();
		} );

		it( 'calls the right actions when a user clicks on the skip feature button', () => {
			// Stub methods that perform side-effects through async actions
			const recordEventStub = sinon.stub( analytics.tracks, 'recordEvent' );
			const addSkippedRecommendationStub = sinon
				.stub( recommendationsActions, 'addSkippedRecommendation' )
				.returns( DUMMY_ACTION );

			render( <FeaturePrompt stepSlug={ stepSlug } />, {
				initialState: buildInitialState( { recommendationsStep: stepSlug } ),
			} );

			const skipFeatureButton = screen.getByRole( 'link', {
				name: /Not now/i,
			} );
			expect( skipFeatureButton ).to.be.not.null;

			// Make sure the enable button points to the right link
			expect( skipFeatureButton.href ).to.have.string( 'recommendations/related-posts' );

			expect( recordEventStub.callCount ).to.be.equal( 0 );
			fireEvent.click( skipFeatureButton );

			// Make sure tracks work
			expect(
				recordEventStub.withArgs( 'jetpack_recommended_feature_decide_later_click', {
					feature: stepSlug,
				} ).callCount
			).to.be.equal( 1 );

			// Make sure addSkippedRecommendation action is called with the right step slug
			expect( addSkippedRecommendationStub.withArgs( stepSlug ).callCount ).to.be.equal( 1 );

			// Restore stubs
			recordEventStub.restore();
			addSkippedRecommendationStub.restore();
		} );
	} );
} );
