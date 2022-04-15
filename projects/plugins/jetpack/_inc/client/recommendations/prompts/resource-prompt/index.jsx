/**
 * External Dependencies
 */
import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { ProgressBar } from '@automattic/components';
import { createInterpolateElement } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import {
	addViewedRecommendation as addViewedRecommendationAction,
	updateRecommendationsStep as updateRecommendationsStepAction,
	getNextRoute,
	getStep,
	isUpdatingRecommendationsStep,
} from 'state/recommendations';
import analytics from 'lib/analytics';
import { PromptLayout } from '../prompt-layout';
import { getStepContent } from '../../feature-utils';

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
		illustrationPath,
		rnaIllustration,
		stepSlug,
		stateStepSlug,
		updatingStep,
		updateRecommendationsStep,
		addViewedRecommendation,
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
			content={
				descriptionList || descriptionSecondary ? (
					<React.Fragment>
						{ descriptionList && (
							<ul className="jp-recommendations-question__description-list">
								{ descriptionList.map( item => (
									<li>{ item }</li>
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
					<a href={ nextRoute } onClick={ onResourceSkipClick }>
						{ __( 'Read Later', 'jetpack' ) }
					</a>
				</div>
			}
			illustrationPath={ illustrationPath }
			rna={ rnaIllustration }
		/>
	);
};

const ResourcePrompt = connect(
	( state, ownProps ) => ( {
		nextRoute: getNextRoute( state ),
		...getStepContent( ownProps.stepSlug ),
		stateStepSlug: getStep( state ),
		updatingStep: isUpdatingRecommendationsStep( state ),
	} ),
	dispatch => ( {
		addViewedRecommendation: stepSlug => dispatch( addViewedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( ResourcePromptComponent );

export { ResourcePrompt };
