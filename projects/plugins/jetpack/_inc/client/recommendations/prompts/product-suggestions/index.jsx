/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { __, _x } from '@wordpress/i18n';
import { ProgressBar } from '@automattic/components';
import { Experiment } from '@automattic/jetpack-explat';

/**
 * Internal dependencies
 */
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { PromptLayout } from '../prompt-layout';
import { ProductSuggestion } from '../product-suggestion';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import analytics from 'lib/analytics';
import {
	addSkippedRecommendation as addSkippedRecommendationAction,
	getProductSuggestions,
	getNextRoute,
	isFetchingRecommendationsProductSuggestions as isFetchingSuggestionsAction,
	isProductSuggestionsAvailable as isProductSuggestionsAvailableCheck,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const ProductSuggestionsComponent = props => {
	const {
		addSkippedRecommendation,
		nextRoute,
		isFetchingSuggestions,
		isProductSuggestionsAvailable,
		updateRecommendationsStep,
		suggestions,
	} = props;

	useEffect( () => {
		updateRecommendationsStep( 'product-suggestions' );
	}, [ updateRecommendationsStep ] );

	const onContinueClick = useCallback( () => {
		analytics.tracks.recordEvent(
			'jetpack_recommendations_product_suggestions_decide_later_click'
		);
		addSkippedRecommendation( 'product-suggestions' );
	}, [ addSkippedRecommendation ] );

	// Display a loading indicator if we are waiting for data.
	// This should only happen if the "step" is accessed directly and not
	// as part of the initial flow where the user selects the site type.
	if ( isFetchingSuggestions ) {
		return <JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />;
	}

	// Redirect the user to the next step if they are not eligible for the product
	// suggestions step. We need to check this for the individual step because:
	// 1. A user can access the step directly through the URL with the current
	//    implementation of the Recommendations routes.
	// 2. If the user stopped at the product suggestions step the last time they
	//    used the Assistant - so the system has registered this step as the active
	//    step - but have since purchased a Jetpack product.
	// 3. Something could have gone wrong while fetching the product suggestions
	//    and we are therefore not able to display anything relevant.
	// @todo This logic could be moved to the recommendations routing logic instead
	//       of existing inside the step component but would probably require a small
	//       refactor of the already large main file of the Jetpack React app.
	// @todo We could potentially show a fallback text that will prompt the user
	//       to visit the "plans" page if the suggestions request failed but they
	//       are still using a Free connection.
	if ( ! isProductSuggestionsAvailable ) {
		// We have to remove the first "#" value from the next route value
		// so React Router will match it with one of the other recommendations paths.
		// E.g. "#/recommendations/monitor" => "/recommendations/monitor".
		return <Redirect to={ nextRoute.substring( 1 ) } />;
	}

	const answerSection = (
		<div className="jp-recommendations-product-suggestion__container">
			<div className="jp-recommendations-product-suggestion__items">
				{ suggestions.map( ( item, key ) => (
					<ProductSuggestion key={ key } product={ item } />
				) ) }
			</div>
			<div className="jp-recommendations-product-suggestion__introductory-pricing">
				{ __( 'Special introductory pricing, all renewals are at full price.', 'jetpack' ) }
			</div>
			<div className="jp-recommendations-product-suggestion__money-back-guarantee">
				<MoneyBackGuarantee text={ __( '14-day money-back guarantee', 'jetpack' ) } />
			</div>
			<a
				className="jp-recommendations-product-suggestion__skip"
				href={ nextRoute }
				onClick={ onContinueClick }
			>
				{ __( 'Decide later', 'jetpack' ) }
			</a>
		</div>
	);

	const question = (
		<Experiment
			name="jetpack_plugin_implementation_test"
			defaultExperience={ _x( 'Choose a plan', 'Recommendations Product Suggestions', 'jetpack' ) }
			treatmentExperience={ _x(
				'Select a plan',
				'Recommendations Product Suggestions',
				'jetpack'
			) }
			loadingExperience={ '⏰ Loading title... ⏰' }
		/>
	);

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '33' } /> }
			question={ question }
			description={ _x(
				'These are the most popular Jetpack plans for sites like yours:',
				'Recommendations Product Suggestions',
				'jetpack'
			) }
			answer={ answerSection }
		/>
	);
};

export const ProductSuggestions = connect(
	state => ( {
		nextRoute: getNextRoute( state ),
		suggestions: getProductSuggestions( state ),
		isFetchingSuggestions: isFetchingSuggestionsAction( state ),
		isProductSuggestionsAvailable: isProductSuggestionsAvailableCheck( state ),
	} ),
	dispatch => ( {
		addSkippedRecommendation: stepSlug => dispatch( addSkippedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( ProductSuggestionsComponent );
