/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import '../../disconnect-survey/_jp-connect_disconnect-survey-card.scss';
import DisconnectSurvey from '../../disconnect-survey';

/**
 * Show the survey step and allow the user to select a response.
 *
 * @param {object} props - The properties.
 * @returns {React.Component} The StepSurvey Component
 */
const StepSurvey = props => {
	const { onExit, onFeedBackProvided, isSubmittingFeedback } = props;

	return (
		<div className="jp-connection__disconnect-dialog__content">
			<h1>{ __( 'Before you go, help us improve Jetpack', 'jetpack' ) }</h1>
			<p className="jp-connection__disconnect-dialog__large-text">
				{ __( 'Let us know what didn‘t work for you', 'jetpack' ) }
			</p>
			<DisconnectSurvey
				onSubmit={ onFeedBackProvided }
				isSubmittingFeedback={ isSubmittingFeedback }
			/>
			<a
				className="jp-connection__disconnect-dialog__link jp-connection__disconnect-dialog__link--bold"
				href="#"
				onClick={ onExit }
			>
				{ __( 'Skip for now', 'jetpack' ) }
			</a>
		</div>
	);
};

StepSurvey.PropTypes = {
	/** Callback function used to close the modal and leave the disconnect flow. */
	onExit: PropTypes.func,
	/** Callback function to handle submission of survey response. */
	onFeedBackProvided: PropTypes.func,
	/** If the survey feedback is currently being saved/ submitted */
	isSubmittingFeedback: PropTypes.bool,
};

export default StepSurvey;
