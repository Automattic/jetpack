/**
 * External dependencies
 */
import { ProgressBar } from '@automattic/components';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { QuestionLayout } from '../layout';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import ExternalLink from 'components/external-link';
import InstallButton from 'components/install-button';
import { getNextRoute, updateRecommendationsStep } from 'state/recommendations';

const CreativeMailQuestionComponent = props => {
	const { nextRoute } = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'creative-mail' );
	} );

	// TODO: actually install creativemail

	return (
		<QuestionLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '83' } /> }
			question={ __(
				'Would you like to turn site visitors into subscribers with Creative Mail?',
				'jetpack'
			) }
			description={ jetpackCreateInterpolateElement(
				__(
					'The Jetpack <strong>Newsletter Form</strong> combined with <strong>Creative Mail</strong> by Constant Contact can help automatically gather subscribers and send them beautiful emails. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				{
					strong: <strong />,
					ExternalLink: (
						<ExternalLink
							href="https://jetpack.com/support/jetpack-blocks/form-block/newsletter-sign-up-form/"
							target="_blank"
							icon={ true }
							iconSize={ 16 }
						/>
					),
				}
			) }
			answer={
				<div className="jp-recommendations-question__install-section">
					<InstallButton primary href={ nextRoute }>
						{ __( 'Install Creative Mail' ) }
					</InstallButton>
					<a href={ nextRoute }>{ __( 'Decide later' ) }</a>
				</div>
			}
			illustrationPath="/recommendations/creative-mail-illustration.svg"
		/>
	);
};

const CreativeMailQuestion = connect(
	state => ( { nextRoute: getNextRoute( state ) } ),
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
	} )
)( CreativeMailQuestionComponent );

export { CreativeMailQuestion };
