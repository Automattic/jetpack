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
	getNextRoute,
	addSelectedRecommendation as addSelectedRecommendationAction,
	addSkippedRecommendation as addSkippedRecommendationAction,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';
import { isFetchingSiteProducts as isFetchingSiteProductsAction } from 'state/site-products';

/**
 * Style dependencies
 */
import './style.scss';

const ProductSuggestionComponent = props => {
	const {
		nextRoute,
		jetpackProducts,
		isFetchingSiteProducts,
		updateRecommendationsStep,
		addSkippedRecommendation,
	} = props;

	useEffect( () => {
		updateRecommendationsStep( 'product-suggestion' );
	}, [ updateRecommendationsStep ] );

	const onContinueClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_decide_later_click' );
		addSkippedRecommendation( 'product-suggestion' );
	}, [ addSkippedRecommendation ] );

	const answerSection = (
		<div className="jp-recommendations-product-suggestion__container">
			<div className="jp-recommendations-product-suggestion__items">
				{ ! isFetchingSiteProducts && (
					<>
						<ProductSuggestionItem
							product={ jetpackProducts.jetpack_backup_daily }
							title={ __( 'Backup Daily', 'jetpack' ) }
							description={ __(
								'Never lose a word, image, page, or time worrying about your site with automated off-site backups and one-click restores.',
								'jetpack'
							) }
							externalLink={ 'https://jetpack.com/upgrade/backup/' }
						/>
						<ProductSuggestionItem
							product={ jetpackProducts.jetpack_security_daily }
							title={ __( 'Security Daily', 'jetpack' ) }
							description={ __(
								'All of the essential Jetpack Security features in one package including Backup, Scan, Anti-spam and more.',
								'jetpack'
							) }
							externalLink={ 'https://jetpack.com/features/security/' }
						/>
					</>
				) }
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

export const ProductSuggestion = connect(
	state => ( {
		nextRoute: getNextRoute( state ),
		jetpackProducts: state.jetpack?.siteProducts?.items,
		isFetchingSiteProducts: isFetchingSiteProductsAction( state ),
	} ),
	dispatch => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
		addSkippedRecommendation: stepSlug => dispatch( addSkippedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( ProductSuggestionComponent );
