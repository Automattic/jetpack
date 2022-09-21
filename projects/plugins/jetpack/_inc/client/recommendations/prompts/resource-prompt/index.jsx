import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import analytics from 'lib/analytics';
import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { ProductSpotlight } from 'recommendations/sidebar/product-spotlight';
import {
	addViewedRecommendation as addViewedRecommendationAction,
	updateRecommendationsStep as updateRecommendationsStepAction,
	getNextRoute,
	getStep,
	isUpdatingRecommendationsStep,
	isStepViewed,
	getProductSlugForStep,
} from 'state/recommendations';
import { DEFAULT_ILLUSTRATION } from '../../constants';
import { getStepContent } from '../../feature-utils';
import { PromptLayout } from '../prompt-layout';

/**
 * Provide a recommendation step that gives a resource.
 * Similar to Feature prompt, but a resource/ link is provided instead of a feature to enable.
 *
 * @param {object} props - Component props.
 * @function Object() { [native code] }
 * @returns {Element} - A react component.
 */
const ResourcePromptComponent = props => {
	const {
		isNew,
		progressValue,
		question,
		description,
		descriptionList,
		descriptionSecondary,
		descriptionLink,
		nextRoute,
		ctaText,
		ctaLink,
		stepSlug,
		stateStepSlug,
		updatingStep,
		spotlightProduct,
		updateRecommendationsStep,
		addViewedRecommendation,
		summaryViewed,
	} = props;

	useEffect( () => {
		// Both addViewedRecommendation and updateRecommendationsStep update the same option under the hood.
		// These actions run with mutually exclusive conditions so they do not over-write one another.
		if ( stepSlug !== stateStepSlug ) {
			updateRecommendationsStep( stepSlug );
		} else if ( stepSlug === stateStepSlug && ! updatingStep ) {
			addViewedRecommendation( stepSlug );
			analytics.tracks.recordEvent( 'jetpack_recommendations_recommendation_viewed', {
				feature: stepSlug,
			} );
		}
	}, [
		stepSlug,
		stateStepSlug,
		updatingStep,
		updateRecommendationsStep,
		addViewedRecommendation,
	] );

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_resource_learn_more_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const onResourceLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_resource_read_click', {
			feature: stepSlug,
		} );
		// Resource link opens a new window, go ahead and navigate to the next step in the flow.
		window.location.href = nextRoute;
	}, [ stepSlug, nextRoute ] );

	const onResourceSkipClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_resource_skip_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const onBackToSummaryClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_resource_back_to_summary_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	return (
		<PromptLayout
			progressBar={
				progressValue ? <ProgressBar color={ '#00A32A' } value={ progressValue } /> : null
			}
			isNew={ isNew }
			question={ question }
			description={ createInterpolateElement( description, {
				br: <br />,
				strong: <strong />,
				ExternalLink: <ExternalLink href={ descriptionLink } onClick={ onExternalLinkClick } />,
			} ) }
			content={
				descriptionList || descriptionSecondary ? (
					<React.Fragment>
						{ descriptionList && (
							<ul className="jp-recommendations-question__description-list">
								{ descriptionList.map( ( item, index ) => (
									<li key={ index }>{ item }</li>
								) ) }
							</ul>
						) }
						{ descriptionSecondary && (
							<p className="jp-recommendations-question__description">{ descriptionSecondary }</p>
						) }
					</React.Fragment>
				) : null
			}
			answer={
				<div className="jp-recommendations-question__install-section">
					<ExternalLink
						type="button"
						className="dops-button is-rna is-primary"
						href={ ctaLink }
						onClick={ onResourceLinkClick }
					>
						{ ctaText }
					</ExternalLink>
					<div className="jp-recommendations-question__jump-nav">
						<a href={ nextRoute } onClick={ onResourceSkipClick }>
							{ __( 'Not now', 'jetpack' ) }
						</a>
						{ summaryViewed && ( // If the summary screen has already been reached, provide a way to get back to it.
							<>
								<span className="jp-recommendations-question__jump-nav-separator">|</span>
								<a onClick={ onBackToSummaryClick } href={ '#/recommendations/summary' }>
									{ __( 'View Recommendations', 'jetpack' ) }{ ' ' }
								</a>
							</>
						) }
					</div>
				</div>
			}
			sidebarCard={
				spotlightProduct ? (
					<ProductSpotlight productSlug={ spotlightProduct } stepSlug={ stepSlug } />
				) : null
			}
			illustration={ DEFAULT_ILLUSTRATION }
		/>
	);
};

const ResourcePrompt = connect(
	( state, ownProps ) => ( {
		nextRoute: getNextRoute( state ),
		...getStepContent( ownProps.stepSlug ),
		stateStepSlug: getStep( state ),
		updatingStep: isUpdatingRecommendationsStep( state ),
		summaryViewed: isStepViewed( state, 'summary' ),
		spotlightProduct: getProductSlugForStep( state, ownProps.stepSlug ),
	} ),
	dispatch => ( {
		addViewedRecommendation: stepSlug => dispatch( addViewedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( ResourcePromptComponent );

export { ResourcePrompt };
