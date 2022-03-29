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
import { getStepContent, mapDispatchToProps } from '../../feature-utils';
import { PromptLayout } from '../prompt-layout';
import Button from 'components/button';
import analytics from 'lib/analytics';
import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	addSkippedRecommendation as addSkippedRecommendationAction,
	addViewedRecommendation as addViewedRecommendationAction,
	getNextRoute,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';

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
		updateRecommendationsStep,
		isNew,
	} = props;

	useEffect( () => {
		// These calls both update the underlying jetpack_options option.
		// The second waits for the first to avoid trying to write the same option with two simultaneous requests.
		updateRecommendationsStep( stepSlug ).then( () => {
			addViewedRecommendation( stepSlug );
		} );
	}, [ stepSlug, updateRecommendationsStep, addViewedRecommendation ] );

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

	const onDecideLaterClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_decide_later_click', {
			feature: stepSlug,
		} );
		addSkippedRecommendation( stepSlug );
	}, [ addSkippedRecommendation, stepSlug ] );

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
					<Button primary rna href={ nextRoute } onClick={ onInstallClick }>
						{ ctaText }
					</Button>
					<a href={ nextRoute } onClick={ onDecideLaterClick }>
						{ __( 'Not now', 'jetpack' ) }
					</a>
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
