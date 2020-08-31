/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { __, sprintf } from '@wordpress/i18n';

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
				alt={ __( 'A jetpack site generating revenue', 'jetpack' ) }
			/>
			<h1>
				{ sprintf(
					/* translators: placeholder is the site title. */
					__( 'Do you intend to make money directly from %s?', 'jetpack' ),
					props.siteTitle
				) }
			</h1>
			<h2 className="jp-setup-wizard-subtitle">{ __( 'Check all that apply', 'jetpack' ) }</h2>
			<div className="jp-setup-wizard-income-answer-container">
				<ChecklistAnswer
					answerKey="advertising-revenue"
					title={ __( 'Advertising or affiliate marketing', 'jetpack' ) }
					details={ __(
						"You're planning on putting ads and or affiliate links on your website.",
						'jetpack'
					) }
				/>
				<ChecklistAnswer
					answerKey="store-revenue"
					title={ __( 'Online store', 'jetpack' ) }
					details={ __(
						"You're planning on selling physical goods, digital downloads, or services directly to your customers.",
						'jetpack'
					) }
				/>
				<ChecklistAnswer
					answerKey="appointments-revenue"
					title={ __( 'Appointments / bookings', 'jetpack' ) }
					details={ __(
						'Your services require booking appointments online, for example a hair salon or accountant.',
						'jetpack'
					) }
				/>
				<ChecklistAnswer
					answerKey="location-revenue"
					title={ __( 'Physical location', 'jetpack' ) }
					details={ __(
						'You have a physical store or business and this website will help drive foot traffic to your location.',
						'jetpack'
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
					{ __( 'Continue', 'jetpack' ) }
				</Button>
				<a
					className="jp-setup-wizard-skip-link"
					href="#/setup/updates"
					onClick={ onNoneApplyClick }
				>
					{ __( 'None of these apply', 'jetpack' ) }
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
