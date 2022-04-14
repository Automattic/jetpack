/**
 * External dependencies
 */
import { ProgressBar } from '@automattic/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getStepContent,
	mapStateToSummaryFeatureProps,
	mapDispatchToProps,
} from '../../feature-utils';
import { PromptLayout } from '../prompt-layout';
import Button from 'components/button';
import analytics from 'lib/analytics';
import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	addSkippedRecommendation as addSkippedRecommendationAction,
	addViewedRecommendation as addViewedRecommendationAction,
	updateRecommendationsStep as updateRecommendationsStepAction,
	getNextRoute,
	getStep,
	isUpdatingRecommendationsStep,
	isFeatureActive,
	isStepViewed,
} from 'state/recommendations';
import Gridicon from 'components/gridicon';

const FeaturePromptComponent = props => {
	const {
		activateFeature,
		addSelectedRecommendation,
		addSkippedRecommendation,
		addViewedRecommendation,
		ctaText,
		description,
		descriptionLink,
		illustrationPath,
		rnaIllustration,
		nextRoute,
		progressValue,
		question,
		stepSlug,
		stateStepSlug,
		updatingStep,
		updateRecommendationsStep,
		isNew,
		featureActive,
		configureButtonLabel,
		configLink,
		summaryViewed,
	} = props;

	useEffect( () => {
		// Both addViewedRecommendation and updateRecommendationsStep update the same option under the hood.
		// These actions run with mutually exclusive conditions so they do not over-write one another.
		if ( stepSlug !== stateStepSlug ) {
			updateRecommendationsStep( stepSlug );
		} else if ( stepSlug === stateStepSlug && ! updatingStep ) {
			addViewedRecommendation( stepSlug );
		}
	}, [
		stepSlug,
		stateStepSlug,
		updatingStep,
		updateRecommendationsStep,
		addViewedRecommendation,
	] );

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_learn_more_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const onInstallClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_enable_click', {
			feature: stepSlug,
		} );
		addSelectedRecommendation( stepSlug );
		activateFeature();
	}, [ activateFeature, addSelectedRecommendation, stepSlug ] );

	const onConfigureClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_configure_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const onDecideLaterClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_decide_later_click', {
			feature: stepSlug,
		} );
		addSkippedRecommendation( stepSlug );
	}, [ addSkippedRecommendation, stepSlug ] );

	const onBackToSummaryClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_back_to_summary_click', {
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
				strong: <strong />,
				ExternalLink: <ExternalLink href={ descriptionLink } onClick={ onExternalLinkClick } />,
			} ) }
			answer={
				<div className="jp-recommendations-question__install-section">
					{ featureActive ? (
						<>
							<div className="jp-recommendations-question__feature-enabled">
								<div className="jp-recommendations-question__checkmark">
									<Gridicon icon="checkmark-circle" size={ 24 } />
								</div>
								<span>Feature Enabled</span>
							</div>
							<Button primary rna href={ configLink } onClick={ onConfigureClick }>
								{ configureButtonLabel }
							</Button>
						</>
					) : (
						<Button primary rna href={ nextRoute } onClick={ onInstallClick }>
							{ ctaText }
						</Button>
					) }
					<div className="jp-recommendations-question__jump-nav">
						<a href={ nextRoute } onClick={ onDecideLaterClick }>
							{ featureActive ? __( 'Next', 'jetpack' ) : __( 'Not now', 'jetpack' ) }
						</a>
						{ summaryViewed && ( // If the summary screen has already been reached, provide a way to get back to it.
							<>
								<span className="jp-recommendations-question__jump-nav-separator">|</span>
								<a onClick={ onBackToSummaryClick } href={ '#/recommendations/summary' }>
									{ __( 'View Summary', 'jetpack' ) }{ ' ' }
								</a>
							</>
						) }
					</div>
				</div>
			}
			illustrationPath={ illustrationPath }
			rna={ rnaIllustration }
		/>
	);
};

const FeaturePrompt = connect(
	( state, ownProps ) => ( {
		nextRoute: getNextRoute( state ),
		...getStepContent( ownProps.stepSlug ),
		...mapStateToSummaryFeatureProps( state, ownProps.stepSlug ),
		stateStepSlug: getStep( state ),
		updatingStep: isUpdatingRecommendationsStep( state ),
		featureActive: isFeatureActive( state, ownProps.stepSlug ),
		summaryViewed: isStepViewed( state, 'summary' ),
	} ),
	( dispatch, ownProps ) => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
		addSkippedRecommendation: stepSlug => dispatch( addSkippedRecommendationAction( stepSlug ) ),
		addViewedRecommendation: stepSlug => dispatch( addViewedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
		...mapDispatchToProps( dispatch, ownProps.stepSlug ),
	} )
)( FeaturePromptComponent );

export { FeaturePrompt };
