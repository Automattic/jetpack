/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-static-element-interactions */

/**
 * External Dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal Dependencies
 */
import { __ } from '@wordpress/i18n';
import { focus } from '@wordpress/dom';
import { TAB } from '@wordpress/keycodes';
import { Button } from '@wordpress/components';
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
	const skipButtonRef = React.createRef();

	/**
	 * Handle keydown events on the survey step to prevent loss of focus outside the modal.
	 * This logic is similar to what is used in the @wordpress/useConstrainedTabbing hook.
	 * Normally, the modal component handles this on its own.
	 * This additional check is needed here for now to fix a bug when using a radio group in the modal.
	 */
	const handleKeyDown = useCallback(
		e => {
			const { target, keyCode, shiftKey } = e;

			// bug only happens when tabbing backwards
			if ( TAB !== keyCode ) {
				return;
			}

			// We are tabbing backwards.
			// If the next element that is focusable is a radio button with the same name as the current target,
			// then we should focus back to the last element in the panel, which is the skip button.
			if ( shiftKey && 'radio' === target.type ) {
				const previous = focus.tabbable.findPrevious( target );
				if ( 'radio' === previous.type && previous.name === target.name ) {
					// focus back on the skip button
					skipButtonRef.current.focus();
				}
			}
		},
		[ skipButtonRef ]
	);

	return (
		<div
			className="jp-connection__disconnect-dialog__content"
			aria-live="polite"
			onKeyDown={ handleKeyDown }
		>
			<h1>{ __( 'Before you go, help us improve Jetpack', 'jetpack' ) }</h1>
			<p className="jp-connection__disconnect-dialog__large-text">
				{ __( 'Let us know what didn‘t work for you', 'jetpack' ) }
			</p>
			<DisconnectSurvey
				onSubmit={ onFeedBackProvided }
				isSubmittingFeedback={ isSubmittingFeedback }
			/>
			<Button ref={ skipButtonRef } isLink onClick={ onExit }>
				{ __( 'Skip for now', 'jetpack' ) }
			</Button>
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
