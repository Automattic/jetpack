/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { ProgressBar } from '@automattic/components';

/**
 * Internal dependencies
 */
import { PromptLayout } from '../prompt-layout';
import { ProductSuggestionItem } from '../product-suggestion-item';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import analytics from 'lib/analytics';
import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	addSkippedRecommendation as addSkippedRecommendationAction,
	getProductSuggestions,
	getNextRoute,
	isFetchingRecommendationsProductSuggestions as isFetchingSuggestionsAction,
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
		updateRecommendationsStep,
		suggestions,
	} = props;

	useEffect( () => {
		updateRecommendationsStep( 'product-suggestions' );
	}, [ updateRecommendationsStep ] );

	const onContinueClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_decide_later_click' );
		addSkippedRecommendation( 'product-suggestions' );
	}, [ addSkippedRecommendation ] );

	const answerSection = (
		<div className="jp-recommendations-product-suggestion__container">
			<div className="jp-recommendations-product-suggestion__items">
				{ ! isFetchingSuggestions &&
					suggestions.map( ( item, key ) => (
						<ProductSuggestionItem key={ key } product={ item } />
					) ) }
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

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '33' } /> }
			question={ __( 'Choose a plan', 'jetpack' ) }
			description={ __(
				'These are the most popular Jetpack plans for sites like yours:',
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
	} ),
	dispatch => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
		addSkippedRecommendation: stepSlug => dispatch( addSkippedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( ProductSuggestionsComponent );
