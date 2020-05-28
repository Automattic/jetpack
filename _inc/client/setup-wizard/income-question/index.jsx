/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { ChecklistAnswer } from '../checklist-answer';
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import {
	getSetupWizardAnswer,
	saveSetupWizardQuestionnnaire,
	updateSetupWizardQuestionnaire,
	updateSetupWizardStatus,
} from 'state/setup-wizard';

import './style.scss';

let IncomeQuestion = props => {
	const location = useLocation();

	useEffect( () => {
		props.updateStatus( 'income-page' );
		analytics.tracks.recordEvent( 'jetpack_wizard_page_view', { step: 'income-page' } );

		const queryParams = new URLSearchParams( location.search );
		const useAnswer = queryParams.get( 'use' );

		if ( [ 'personal', 'business' ].includes( useAnswer ) ) {
			props.updateSiteUseQuestion( { use: useAnswer } );
			props.saveQuestionnaire();
			analytics.tracks.recordEvent( 'jetpack_wizard_question_answered', {
				question: 'use',
				answer: useAnswer,
			} );
		}
	}, [ location ] );

	const onContinueClick = useCallback( () => {
		props.saveQuestionnaire();
		for ( const answer in props.answers ) {
			if ( props.answers[ answer ] ) {
				analytics.tracks.recordEvent( 'jetpack_wizard_question_answered', {
					question: 'income',
					answer: answer,
				} );
			}
		}
	}, [ props.answers ] );

	const onNoneApplyClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_setup_wizard_question_skipped', {
			question: 'income',
		} );
	} );

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
					onClick={ onContinueClick }
				>
					{ __( 'Continue' ) }
				</Button>
				<a
					className="jp-setup-wizard-skip-link"
					href="#/setup/updates"
					onClick={ onNoneApplyClick }
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
	state => ( {
		answers: [
			'advertising-revenue',
			'store-revenue',
			'appointments-revenue',
			'location-revenue',
		].reduce( ( acc, curr ) => ( { ...acc, [ curr ]: getSetupWizardAnswer( state, curr ) } ), {} ),
	} ),
	dispatch => ( {
		saveQuestionnaire: () => dispatch( saveSetupWizardQuestionnnaire() ),
		updateSiteUseQuestion: answer => dispatch( updateSetupWizardQuestionnaire( answer ) ),
		updateStatus: status => dispatch( updateSetupWizardStatus( status ) ),
	} )
)( IncomeQuestion );

export { IncomeQuestion };
