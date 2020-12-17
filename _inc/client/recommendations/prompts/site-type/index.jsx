/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { ProgressBar } from '@automattic/components';

/**
 * Internal dependencies
 */
import { PromptLayout } from '../prompt-layout';
import { CheckboxAnswer } from '../checkbox-answer';
import Button from 'components/button';
import analytics from 'lib/analytics';
import { getSiteTitle } from 'state/initial-state';
import {
	getDataByKey,
	getNextRoute,
	saveRecommendationsData,
	updateRecommendationsStep,
} from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const SiteTypeQuestionComponent = props => {
	const { answers, nextRoute, siteTitle } = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'site-type-question' );
	} );

	const onContinueClick = useCallback( () => {
		props.saveRecommendationsData();
		analytics.tracks.recordEvent( 'jetpack_recommendations_site_type_answered', answers );
	} );

	const answerSection = (
		<div className="jp-recommendations-question__site-type-answer-container">
			<div className="jp-recommendations-question__site-type-checkboxes">
				<CheckboxAnswer
					answerKey={ 'site-type-personal' }
					title={ __( 'Personal' ) }
					info={ __(
						'Personal sites usually include blogs, resume sites, weddings or other events, and hobby sites.'
					) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-business' }
					title={ __( 'Business' ) }
					info={ __(
						'Business sites usually include shops, services like lawyers, or plumbers, and advertisers or influencers.'
					) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-store' }
					title={ __( 'Store' ) }
					info={ __(
						'Stores typically include online e-commerce stores selling goods, services, or digital downloads.'
					) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-other' }
					title={ __( 'Other' ) }
					info={ __(
						'Other sites may include non-profits, colleges or schools, apps, real-estate, or others.'
					) }
				/>
			</div>
			<Button primary href={ nextRoute } onClick={ onContinueClick }>
				{ __( 'Continue' ) }
			</Button>
			<div className="jp-recommendations-site-type-question__continue-description">
				{ __(
					'All of Jetpack’s great features await you and we’ll recommend some of our favorites.'
				) }
			</div>
		</div>
	);

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '17' } /> }
			/* translators: placeholder is the title of the site */
			question={ sprintf( __( 'What type of site is %s?', 'jetpack' ), siteTitle ) }
			description={ __(
				'This assistant will help you get the most from Jetpack. Tell us more about your goals and we’ll recommend relevant features to help you succeed.'
			) }
			answer={ answerSection }
			illustrationPath="/recommendations/site-type-illustration.png"
		/>
	);
};

export const SiteTypeQuestion = connect(
	state => ( {
		nextRoute: getNextRoute( state ),
		siteTitle: getSiteTitle( state ),
		answers: {
			personal: getDataByKey( state, 'site-type-personal' ),
			business: getDataByKey( state, 'site-type-business' ),
			store: getDataByKey( state, 'site-type-store' ),
			other: getDataByKey( state, 'site-type-other' ),
		},
	} ),
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
		saveRecommendationsData: () => dispatch( saveRecommendationsData() ),
	} )
)( SiteTypeQuestionComponent );
