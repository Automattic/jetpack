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
import { QuestionLayout } from '../layout';
import Button from 'components/button';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import ExternalLink from 'components/external-link';
import { getNextRoute, updateRecommendationsStep } from 'state/recommendations';

const QuestionComponent = props => {
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

	const onInstallClick = useCallback( () => {
		props.enable();
	} );

	return (
		<QuestionLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ progressValue } /> }
			question={ question }
			description={ jetpackCreateInterpolateElement( description, {
				strong: <strong />,
				ExternalLink: (
					<ExternalLink href={ descriptionLink } target="_blank" icon={ true } iconSize={ 16 } />
				),
			} ) }
			answer={
				<div className="jp-recommendations-question__install-section">
					<Button primary href={ nextRoute } onClick={ onInstallClick }>
						{ ctaText }
					</Button>
					<a href={ nextRoute }>{ __( 'Decide later' ) }</a>
				</div>
			}
			illustrationPath={ illustrationPath }
		/>
	);
};

const Question = connect(
	( state, ownProps ) => ( {
		nextRoute: getNextRoute( state ),
		...getStepContent( ownProps.stepSlug ),
	} ),
	( dispatch, ownProps ) => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
		...mapDispatchToProps( dispatch, ownProps.stepSlug ),
	} )
)( QuestionComponent );

export { Question };
