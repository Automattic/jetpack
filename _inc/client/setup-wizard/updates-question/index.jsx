/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';
import { saveSetupWizardQuestionnnaire, updateSetupWizardQuestionnaire } from 'state/setup-wizard';

import './style.scss';

let UpdatesQuestion = props => {
	useEffect( () => {
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
				alt={ __( 'A jetpack site using publicize to share posts' ) }
			/>
			<h1>
				{ __( 'Will %(siteTitle)s have blog posts, news, or regular updates?', {
					args: { siteTitle: props.siteTitle },
				} ) }
			</h1>
			<div className="jp-setup-wizard-updates-answer-buttons-container">
				<Button
					href="#/setup/features"
					primary
					className="jp-setup-wizard-updates-button"
					onClick={ onYesButtonClick }
				>
					{ __( 'Yes' ) }
				</Button>
				<Button
					href="#/setup/features"
					className="jp-setup-wizard-updates-button"
					onClick={ onNoButtonClick }
				>
					{ __( 'No' ) }
				</Button>
			</div>
			<a className="jp-setup-wizard-skip-link" href="#/setup/features" onClick={ onSkipLinkClick }>
				{ __( 'Skip' ) }
			</a>
		</div>
	);
};

UpdatesQuestion = connect(
	state => ( {} ),
	dispatch => ( {
		updateUpdatesQuestion: answer => dispatch( updateSetupWizardQuestionnaire( answer ) ),
		saveQuestionnaire: () => dispatch( saveSetupWizardQuestionnnaire() ),
	} )
)( UpdatesQuestion );

export { UpdatesQuestion };
