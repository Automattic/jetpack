/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { ProgressBar } from '@automattic/components';

/**
 * Internal dependencies
 */
import { QuestionLayout } from '../layout';
import { CheckboxAnswer } from '../checkbox-answer';
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import { getSiteTitle } from 'state/initial-state';

/**
 * Style dependencies
 */
import './style.scss';

const SiteTypeQuestionComponent = ( { siteTitle } ) => {
	const answerSection = (
		<div className="jp-recommendations-question__site-type-answer-container">
			<div className="jp-recommendations-question__site-type-checkboxes">
				<CheckboxAnswer
					answerKey={ 'site-type-personal' }
					title={ __( 'Personal' ) }
					info={ __( 'TODO change me personal info placeholder' ) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-business' }
					title={ __( 'Business' ) }
					info={ __( 'TODO change me personal info placeholder' ) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-store' }
					title={ __( 'Store' ) }
					info={ __( 'TODO change me personal info placeholder' ) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-other' }
					title={ __( 'Other' ) }
					info={ __( 'TODO change me personal info placeholder' ) }
				/>
			</div>
			<Button primary>{ __( 'Continue' ) }</Button>
			<div className="jp-recommendations-site-type-question__continue-description">
				{ __(
					'All of Jetpack’s great features await you and we’ll recommend some of our favorites.'
				) }
			</div>
		</div>
	);

	return (
		<QuestionLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '17' } /> }
			question={ sprintf( __( 'What type of site is %s?', 'jetpack' ), siteTitle ) }
			description={ __(
				'This assistant will help you get the most from Jetpack. Tell us more about your goals and we’ll recommend relevant features to help you succeed.'
			) }
			answer={ answerSection }
			illustration={
				<img
					className="jp-recommendations-site-type__illustration"
					src={ imagePath + '/recommendations/site-type-illustration.png' }
					alt=""
				/>
			}
		/>
	);
};

export const SiteTypeQuestion = connect(
	state => ( { siteTitle: getSiteTitle( state ) } ),
	dispatch => ( {} )
)( SiteTypeQuestionComponent );
