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

const RelatedPostsQuestionComponent = props => {
	const { nextRoute } = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'related-posts' );
	} );

	const onEnableClick = useCallback( () => {
		props.enableRelatedPosts();
	} );

	return (
		<QuestionLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '67' } /> }
			question={ __(
				'Would you like Related Posts to display at the bottom of your content?',
				'jetpack'
			) }
			description={ jetpackCreateInterpolateElement(
				__(
					'Displaying <strong>Related Posts</strong> at the end of your content keeps visitors engaged and on your site longer. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				{
					strong: <strong />,
					ExternalLink: (
						<ExternalLink
							href="https://jetpack.com/support/related-posts/"
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
						{ __( 'Enable Related Posts' ) }
					</Button>
					<a href={ nextRoute }>{ __( 'Decide later' ) }</a>
				</div>
			}
			illustrationPath="/recommendations/related-posts-illustration.png"
		/>
	);
};

const RelatedPostsQuestion = connect(
	state => ( { nextRoute: getNextRoute( state ) } ),
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
		enableRelatedPosts: () => dispatch( updateSettings( { 'related-posts': true } ) ),
	} )
)( RelatedPostsQuestionComponent );

export { RelatedPostsQuestion };
