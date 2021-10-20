/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

/**
 * External Dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import '../../disconnect-survey/_jp-disconnect-survey-card.scss';
import DisconnectSurvey from '../../disconnect-survey';

/**
 * Show the survey step and allow the user to select a response.
 *
 * @param {Function} props.onExit - Callback function used to close the modal and leave the disconnect flow.
 * @param {Function} props.onFeedbackProvided - Callback function to handle submission of survey repsonse.
 * @returns {React.Component} The StepSurvey Component
 */

const StepSurvey = props => {
	const { onExit, onFeedBackProvided } = props;

	return (
		<div className="jp-disconnect-dialog__content">
			<h1>{ __( 'Before you go, help us improve Jetpack' ) }</h1>
			<p className="jp-disconnect-dialog__large-text">
				{ __( 'Let us know what didn‘t work for you', 'jetpack' ) }
			</p>
			<DisconnectSurvey onSubmit={ onFeedBackProvided } />
			<a
				className="jp-disconnect-dialog__link jp-disconnect-dialog__link--bold"
				href="#"
				onClick={ onExit }
			>
				{ __( 'Skip for now', 'jetpack' ) }
			</a>
		</div>
	);
};

export default StepSurvey;
