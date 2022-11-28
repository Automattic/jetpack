import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import analytics from 'lib/analytics';
import * as React from 'react';
import * as recommendationsActions from 'state/recommendations/actions';
import { render, screen } from 'test/test-utils';
import * as featureUtils from '../../../feature-utils';
import { FeaturePrompt } from '../index';

/**
 * Build initial state.
 *
 * @param {object} _ - Dummy positional parameter.
 * @param {string} _.recommendationsStep - Value for jetpack.recommendations.step.
 * @returns {object} - State.
 */
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
				requests: {},
				step: recommendationsStep,
				siteDiscount: {
					viewed: 'site-type',
				},
			},
			settings: {
				items: [],
			},
			siteData: {
				requests: {
					isFetchingSiteDiscount: false,
				},
			},
			introOffers: {
				requests: {
					isFetching: false,
				},
			},
		},
	};
}

describe( 'Recommendations – Feature Prompt', () => {
	const DUMMY_ACTION = { type: 'dummy' };
	let updateRecommendationsStepStub;
	let addViewedRecommendationStub;

	beforeAll( () => {
		updateRecommendationsStepStub = jest
			.spyOn( recommendationsActions, 'updateRecommendationsStep' )
			.mockReturnValue( DUMMY_ACTION );
		addViewedRecommendationStub = jest
			.spyOn( recommendationsActions, 'addViewedRecommendation' )
			.mockReturnValue( DUMMY_ACTION );
	} );

	afterAll( () => {
		updateRecommendationsStepStub.mockRestore();
		addViewedRecommendationStub.mockRestore();
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
			).toBeInTheDocument();
		} );

		it( 'shows the enable and skip feature buttons', () => {
			render( <FeaturePrompt stepSlug={ stepSlug } />, {
				initialState: buildInitialState( { recommendationsStep: stepSlug } ),
			} );

			expect(
				screen.getByRole( 'link', {
					name: /Enable Downtime Monitoring/i,
				} )
			).toBeInTheDocument();

			expect(
				screen.getByRole( 'link', {
					name: /Not now/i,
				} )
			).toBeInTheDocument();
		} );

		it( 'calls the right actions when a user clicks on the enable feature button', async () => {
			const user = userEvent.setup();

			// Stub methods that perform side-effects through async actions
			const recordEventStub = jest
				.spyOn( analytics.tracks, 'recordEvent' )
				.mockImplementation( () => {} );
			const addSelectedRecommendationStub = jest
				.spyOn( recommendationsActions, 'addSelectedRecommendation' )
				.mockReturnValue( DUMMY_ACTION );
			const startInstallingStub = jest
				.spyOn( recommendationsActions, 'startFeatureInstall' )
				.mockReturnValue( DUMMY_ACTION );
			// Fake a promise-ish return since we call the "finally" method after the feature is activated.
			const activateFeatureStub = jest.fn().mockImplementation( () => {
				return {
					finally: () => {},
				};
			} );
			const mapDispatchToPropsStub = jest
				.spyOn( featureUtils, 'mapDispatchToProps' )
				.mockReturnValue( {
					activateFeature: activateFeatureStub,
				} );

			render( <FeaturePrompt stepSlug={ stepSlug } />, {
				initialState: buildInitialState( { recommendationsStep: stepSlug } ),
			} );

			const enableFeatureButton = screen.getByRole( 'link', {
				name: /Enable Downtime Monitoring/i,
			} );
			expect( enableFeatureButton ).toBeInTheDocument();

			// Make sure the enable button points to the right link
			expect( enableFeatureButton.href ).toContain( 'recommendations/related-posts' );

			// The jetpack_recommendations_recommendation_viewed event has already fired on step load
			expect( recordEventStub ).toHaveBeenCalledTimes( 1 );
			await user.click( enableFeatureButton );

			// Make sure tracks work
			expect( recordEventStub ).toHaveBeenCalledWith( 'jetpack_recommended_feature_enable_click', {
				feature: stepSlug,
			} );

			// Make sure addSelectedRecommendation action is called with the right step slug
			expect( addSelectedRecommendationStub ).toHaveBeenCalledWith( stepSlug );

			// Make sure activateFeature action is called
			expect( activateFeatureStub ).toHaveBeenCalledTimes( 1 );

			expect( startInstallingStub ).toHaveBeenCalledTimes( 1 );

			// Restore stubs
			recordEventStub.mockRestore();
			addSelectedRecommendationStub.mockRestore();
			mapDispatchToPropsStub.mockRestore();
		} );

		it( 'calls the right actions when a user clicks on the skip feature button', async () => {
			const user = userEvent.setup();

			// Stub methods that perform side-effects through async actions
			const recordEventStub = jest
				.spyOn( analytics.tracks, 'recordEvent' )
				.mockImplementation( () => {} );
			const addSkippedRecommendationStub = jest
				.spyOn( recommendationsActions, 'addSkippedRecommendation' )
				.mockReturnValue( DUMMY_ACTION );

			render( <FeaturePrompt stepSlug={ stepSlug } />, {
				initialState: buildInitialState( { recommendationsStep: stepSlug } ),
			} );

			const skipFeatureButton = screen.getByRole( 'link', {
				name: /Not now/i,
			} );
			expect( skipFeatureButton ).toBeInTheDocument();

			// Make sure the enable button points to the right link
			expect( skipFeatureButton.href ).toContain( 'recommendations/related-posts' );

			// The jetpack_recommendations_recommendation_viewed event has already fired on step load
			expect( recordEventStub ).toHaveBeenCalledTimes( 1 );
			await user.click( skipFeatureButton );

			// Make sure tracks work
			expect( recordEventStub ).toHaveBeenCalledWith(
				'jetpack_recommended_feature_decide_later_click',
				{
					feature: stepSlug,
				}
			);

			// Make sure addSkippedRecommendation action is called with the right step slug
			expect( addSkippedRecommendationStub ).toHaveBeenCalledWith( stepSlug );

			// Restore stubs
			recordEventStub.mockRestore();
			addSkippedRecommendationStub.mockRestore();
		} );
	} );
} );
