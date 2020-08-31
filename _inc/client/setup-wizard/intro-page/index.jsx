/**
 * External dependencies
 */
import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
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

let IntroPage = props => {
	useEffect( () => {
		props.updateStatus( 'intro-page' );
		analytics.tracks.recordEvent( 'jetpack_wizard_page_view', { step: 'intro-page' } );
	}, [] );

	const onPersonalButtonClick = useCallback( () => {
		props.updateSiteUseQuestion( { use: 'personal' } );
		props.saveQuestionnaire();
		analytics.tracks.recordEvent( 'jetpack_wizard_question_answered', {
			question: 'use',
			answer: 'personal',
		} );
	}, [] );

	const onBusinessButtonClick = useCallback( () => {
		props.updateSiteUseQuestion( { use: 'business' } );
		props.saveQuestionnaire();
		analytics.tracks.recordEvent( 'jetpack_wizard_question_answered', {
			question: 'use',
			answer: 'business',
		} );
	}, [] );

	const onSkipLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_setup_wizard_question_skipped', {
			question: 'use',
		} );
	}, [] );

	return (
		<div className="jp-setup-wizard-main">
			<img
				width="200px"
				height="200px"
				src={ imagePath + '/jetpack-powering-up.svg' }
				alt={ __( 'A jetpack site powering up', 'jetpack' ) }
			/>
			<h1 className="jp-setup-wizard-header">
				{ __( 'Set up Jetpack for better site security, performance, and more.', 'jetpack' ) }
			</h1>
			<p className="jp-setup-wizard-paragraph">
				{ __( 'Jetpack is a cloud-powered tool built by Automattic.', 'jetpack' ) }
			</p>
			<p className="jp-setup-wizard-paragraph">
				{ __(
					'Answer a few questions and we’ll help you secure, speed up, customize, and grow your WordPress website.',
					'jetpack'
				) }
			</p>
			<div className="jp-setup-wizard-intro-question">
				<h2>
					{ sprintf(
						/* translators: placeholder is the site title. */
						__( 'What will %s be used for?', 'jetpack' ),
						props.siteTitle
					) }
				</h2>
				<div className="jp-setup-wizard-answer-buttons">
					<Button
						href="#/setup/income"
						primary
						className="jp-setup-wizard-button"
						onClick={ onPersonalButtonClick }
					>
						{ __( 'Personal Use', 'jetpack' ) }
					</Button>
					<Button
						href="#/setup/income"
						primary
						className="jp-setup-wizard-button"
						onClick={ onBusinessButtonClick }
					>
						{ __( 'Business Use', 'jetpack' ) }
					</Button>
				</div>
				<a
					className="jp-setup-wizard-skip-link"
					href="#/setup/features"
					onClick={ onSkipLinkClick }
				>
					{ __( 'Skip to recommended features', 'jetpack' ) }
				</a>
			</div>
		</div>
	);
};

IntroPage.propTypes = {
	siteTitle: PropTypes.string.isRequired,
};

IntroPage = connect(
	state => ( {} ),
	dispatch => ( {
		updateSiteUseQuestion: answer => dispatch( updateSetupWizardQuestionnaire( answer ) ),
		saveQuestionnaire: () => dispatch( saveSetupWizardQuestionnnaire() ),
		updateStatus: status => dispatch( updateSetupWizardStatus( status ) ),
	} )
)( IntroPage );

export { IntroPage };
