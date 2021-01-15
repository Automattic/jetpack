/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import {
	saveSetupWizardQuestionnnaire,
	updateSetupWizardQuestionnaire,
	updateSetupWizardStatus,
} from 'state/setup-wizard';

import './style.scss';

let UpdatesQuestion = props => {
	useEffect( () => {
		props.updateStatus( 'updates-page' );
		analytics.tracks.recordEvent( 'jetpack_wizard_page_view', { step: 'updates-page' } );
	}, [] );

	const onYesButtonClick = useCallback( () => {
		props.updateUpdatesQuestion( { 'site-updates': true } );
		props.saveQuestionnaire();
		analytics.tracks.recordEvent( 'jetpack_wizard_question_answered', {
			question: 'updates',
			answer: 'yes',
		} );
	}, [] );

	const onNoButtonClick = useCallback( () => {
		props.updateUpdatesQuestion( { 'site-updates': false } );
		props.saveQuestionnaire();
		analytics.tracks.recordEvent( 'jetpack_wizard_question_answered', {
			question: 'updates',
			answer: 'no',
		} );
	}, [] );

	const onSkipLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_setup_wizard_question_skipped', {
			question: 'updates',
		} );
	}, [] );

	return (
		<div className="jp-setup-wizard-main jp-setup-wizard-updates-main">
			<img
				src={ imagePath + 'jetpack-publicize-1.svg' }
				alt={ __( 'A jetpack site using publicize to share posts', 'jetpack' ) }
			/>
			<h1>
				{ sprintf(
					/* Translators: placeholder is the name of the site. */
					__( 'Will %s have blog posts, news, or regular updates?', 'jetpack' ),
					props.siteTitle
				) }
			</h1>
			<div className="jp-setup-wizard-updates-answer-buttons-container">
				<Button
					href="#/setup/features"
					primary
					className="jp-setup-wizard-updates-button"
					onClick={ onYesButtonClick }
				>
					{ __( 'Yes', 'jetpack' ) }
				</Button>
				<Button
					href="#/setup/features"
					className="jp-setup-wizard-updates-button"
					onClick={ onNoButtonClick }
				>
					{ __( 'No', 'jetpack' ) }
				</Button>
			</div>
			<a className="jp-setup-wizard-skip-link" href="#/setup/features" onClick={ onSkipLinkClick }>
				{ __( 'Skip', 'jetpack' ) }
			</a>
		</div>
	);
};

UpdatesQuestion = connect(
	state => ( {} ),
	dispatch => ( {
		updateUpdatesQuestion: answer => dispatch( updateSetupWizardQuestionnaire( answer ) ),
		saveQuestionnaire: () => dispatch( saveSetupWizardQuestionnnaire() ),
		updateStatus: status => dispatch( updateSetupWizardStatus( status ) ),
	} )
)( UpdatesQuestion );

export { UpdatesQuestion };
