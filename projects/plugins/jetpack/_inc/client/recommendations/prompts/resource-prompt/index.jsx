/**
 * External Dependencies
 */
import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { ProgressBar } from '@automattic/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import {
	addViewedRecommendation as addViewedRecommendationAction,
	getNextRoute,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';
import analytics from 'lib/analytics';
import { PromptLayout } from '../prompt-layout';
import { getStepContent } from '../../feature-utils';
import { ExternalLink } from '@wordpress/components';

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
		stepSlug,
		updateRecommendationsStep,
		addViewedRecommendation,
	} = props;

	useEffect( () => {
		updateRecommendationsStep( stepSlug );
		addViewedRecommendation( stepSlug );
	}, [ stepSlug, updateRecommendationsStep, addViewedRecommendation ] );

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_resource_learn_more_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const onResourceLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_resource_read_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

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
		/>
	);
};

const ResourcePrompt = connect(
	( state, ownProps ) => ( {
		nextRoute: getNextRoute( state ),
		...getStepContent( ownProps.stepSlug ),
	} ),
	dispatch => ( {
		addViewedRecommendation: stepSlug => dispatch( addViewedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( ResourcePromptComponent );

export { ResourcePrompt };
