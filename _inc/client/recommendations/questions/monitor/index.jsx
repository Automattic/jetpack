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
import { getNextRoute, updateRecommendationsStep } from 'state/recommendations';
import { updateSettings } from 'state/settings';

const MonitorQuestionComponent = props => {
	const { nextRoute } = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'monitor' );
	} );

	const onEnableClick = useCallback( () => {
		props.enableMonitor();
	} );

	return (
		<QuestionLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '50' } /> }
			question={ __(
				'Would you like Monitor to notify you if your site goes offline?',
				'jetpack'
			) }
			description={ jetpackCreateInterpolateElement(
				__(
					'If your site ever goes down, <strong>Monitor</strong> will send you an email or push notitification to let you know. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				{
					strong: <strong />,
					ExternalLink: (
						<ExternalLink
							href="https://jetpack.com/support/monitor/"
							target="_blank"
							icon={ true }
							iconSize={ 16 }
						/>
					),
				}
			) }
			answer={
				<div className="jp-recommendations-question__install-section">
					<Button primary href={ nextRoute } onClick={ onEnableClick }>
						{ __( 'Enable Monitor' ) }
					</Button>
					<a href={ nextRoute }>{ __( 'Decide later' ) }</a>
				</div>
			}
			illustrationPath="/recommendations/monitor-illustration.svg"
		/>
	);
};

const MonitorQuestion = connect(
	state => ( { nextRoute: getNextRoute( state ) } ),
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
		enableMonitor: () => dispatch( updateSettings( { monitor: true } ) ),
	} )
)( MonitorQuestionComponent );

export { MonitorQuestion };
