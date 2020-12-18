/**
 * External dependencies
 */
import { ProgressBar } from '@automattic/components';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getStepContent, mapDispatchToProps } from './props';
import { PromptLayout } from '../prompt-layout';
import Button from 'components/button';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import ExternalLink from 'components/external-link';
import analytics from 'lib/analytics';
import {
	addSelectedRecommendation,
	addSkippedRecommendation,
	getNextRoute,
	updateRecommendationsStep,
} from 'state/recommendations';

const FeaturePromptComponent = props => {
	const {
		ctaText,
		description,
		descriptionLink,
		illustrationPath,
		nextRoute,
		progressValue,
		question,
		stepSlug,
	} = props;

	useEffect( () => {
		props.updateRecommendationsStep( stepSlug );
	} );

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_learn_more_click', {
			feature: stepSlug,
		} );
	} );

	const onInstallClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_enable_click', {
			feature: stepSlug,
		} );
		props.addSelectedRecommendation( stepSlug );
		props.enable();
	}, [ props.enable ] );

	const onDecideLaterClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_decide_later_click', {
			feature: stepSlug,
		} );
		props.addSkippedRecommendation( stepSlug );
	} );

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ progressValue } /> }
			question={ question }
			description={ jetpackCreateInterpolateElement( description, {
				strong: <strong />,
				ExternalLink: (
					<ExternalLink
						href={ descriptionLink }
						target="_blank"
						icon={ true }
						iconSize={ 16 }
						onClick={ onExternalLinkClick }
					/>
				),
			} ) }
			answer={
				<div className="jp-recommendations-question__install-section">
					<Button primary href={ nextRoute } onClick={ onInstallClick }>
						{ ctaText }
					</Button>
					<a href={ nextRoute } onClick={ onDecideLaterClick }>
						{ __( 'Decide later' ) }
					</a>
				</div>
			}
			illustrationPath={ illustrationPath }
		/>
	);
};

const FeaturePrompt = connect(
	( state, ownProps ) => ( {
		nextRoute: getNextRoute( state ),
		...getStepContent( ownProps.stepSlug ),
	} ),
	( dispatch, ownProps ) => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendation( stepSlug ) ),
		addSkippedRecommendation: stepSlug => dispatch( addSkippedRecommendation( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
		...mapDispatchToProps( dispatch, ownProps.stepSlug ),
	} )
)( FeaturePromptComponent );

export { FeaturePrompt };
