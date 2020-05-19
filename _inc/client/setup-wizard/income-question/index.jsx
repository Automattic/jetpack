/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { ChecklistAnswer } from '../checklist-answer';
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import { saveSetupWizardQuestionnnaire } from 'state/setup-wizard';

import './style.scss';

let IncomeQuestion = props => {
	return (
		<div className="jp-setup-wizard-main">
			<img
				width="200px"
				height="200px"
				src={ imagePath + 'generating-cash.svg' }
				alt={ __( 'A jetpack site generating revenue' ) }
			/>
			<h1>
				{ __( 'Do you intend to make money directly from %(siteUrl)s?', {
					args: { siteUrl: props.siteTitle },
				} ) }
			</h1>
			<h2 className="jp-setup-wizard-subtitle">{ __( 'Check all that apply' ) }</h2>
			<div className="jp-setup-wizard-income-answer-container">
				<ChecklistAnswer
					answerKey="advertising-revenue"
					title={ __( 'Advertising or affiliate marketing' ) }
					details={ __( "You're planning on putting ads and or affiliate links on your website." ) }
				/>
				<ChecklistAnswer
					answerKey="store-revenue"
					title={ __( 'Online store' ) }
					details={ __(
						"You're planning on selling physical goods, digital downloads, or services directly to your customers."
					) }
				/>
				<ChecklistAnswer
					answerKey="appointments-revenue"
					title={ __( 'Appointments / bookings' ) }
					details={ __(
						'Your services require booking appointments online, for example a hair salon or accountant.'
					) }
				/>
				<ChecklistAnswer
					answerKey="location-revenue"
					title={ __( 'Physical location' ) }
					details={ __(
						'You have a physical store or business and this website will help drive foot traffic to your location.'
					) }
				/>
			</div>
			<div className="jp-setup-wizard-advance-container">
				<Button
					href="#/setup/updates"
					primary
					className="jp-setup-wizard-button"
					onClick={ props.saveQuestionnaire }
				>
					{ __( 'Continue' ) }
				</Button>
				<a
					className="jp-setup-wizard-skip-link"
					href="#/setup/updates"
					onClick={ props.saveQuestionnaire }
				>
					{ __( 'None of these apply' ) }
				</a>
			</div>
		</div>
	);
};

IncomeQuestion.propTypes = {
	siteTitle: PropTypes.string.isRequired,
};

IncomeQuestion = connect(
	state => ( {} ),
	dispatch => ( {
		saveQuestionnaire: () => dispatch( saveSetupWizardQuestionnnaire() ),
	} )
)( IncomeQuestion );

export { IncomeQuestion };
