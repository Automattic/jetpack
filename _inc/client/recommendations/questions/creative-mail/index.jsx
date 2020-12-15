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
import { QuestionLayout } from '../layout';
import Button from 'components/button';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import ExternalLink from 'components/external-link';
import restApi from 'rest-api';
import { getNextRoute, updateRecommendationsStep } from 'state/recommendations';
import { fetchPluginsData } from 'state/site/plugins';

const CreativeMailQuestionComponent = props => {
	const { nextRoute } = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'creative-mail' );
	} );

	const onInstallClick = useCallback( () => {
		props.installCreativeMailAndReloadPluginsData();
	} );

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
					<Button primary href={ nextRoute } onClick={ onInstallClick }>
						{ __( 'Install Creative Mail' ) }
					</Button>
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
		installCreativeMailAndReloadPluginsData: () => {
			restApi.installPlugin( 'creative-mail-by-constant-contact', 'recommendations' ).then( () => {
				dispatch( fetchPluginsData() );
			} );
		},
	} )
)( CreativeMailQuestionComponent );

export { CreativeMailQuestion };
