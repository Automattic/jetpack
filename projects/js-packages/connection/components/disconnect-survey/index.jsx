/**
 * External Dependencies
 */
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal Dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SurveyChoice from './survey-choice';

/**
 * Handles showing the disconnect survey.
 *
 * @param {object} props - The component props.
 * @returns {React.Component} - DisconnectSurvey component.
 */
const DisconnectSurvey = props => {
	const { onSubmit, isSubmittingFeedback } = props;
	const [ selectedAnswer, setSelectedAnswer ] = useState();
	const [ customResponse, setCustomResponse ] = useState();

	const options = [
		{
			id: 'troubleshooting',
			answerText: __( "Troubleshooting - I'll be reconnecting afterwards.", 'jetpack' ),
		},
		{
			id: 'not-working',
			answerText: __( "I can't get it to work.", 'jetpack' ),
		},
		{
			id: 'slowed-down-site',
			answerText: __( 'It slowed down my site.', 'jetpack' ),
		},
		{
			id: 'buggy',
			answerText: __( "It's buggy.", 'jetpack' ),
		},
		{
			id: 'what-does-it-do',
			answerText: __( "I don't know what it does.", 'jetpack' ),
		},
	];

	const customOption = {
		id: 'another-reason',
	};

	/**
	 * Handle Submission of the survey.
	 * Will send the survey response to the collection endpoint.
	 */
	const handleSurveySubmit = useCallback( () => {
		const answerText = selectedAnswer === customOption.id ? customResponse : '';
		onSubmit( selectedAnswer, answerText );
	}, [ onSubmit, customOption.id, customResponse, selectedAnswer ] );

	/**
	 * Prevent any default submission of the form element
	 * Response is sent by clicking on the "Submit Feedback" button
	 *
	 * @param {object} e - onSubmit event from the form
	 */
	const handleFormSubmit = useCallback( e => {
		e.preventDefault();
		return false;
	}, [] );

	/**
	 * Handle input into the custom response field.
	 *
	 * @param {object} e - onChange event for the custom input
	 */
	const handleCustomResponse = useCallback(
		e => {
			const value = e.target.value;
			e.stopPropagation();
			setCustomResponse( value );
			if ( selectedAnswer !== customOption.id ) {
				setSelectedAnswer( customOption.id );
			}
		},
		[ setCustomResponse, customOption.id, selectedAnswer ]
	);

	/**
	 * Set the selected answer to the custom option.
	 * This is set as its own callback function here to avoid using binding in props
	 */
	const setCustomOptionAsSelected = useCallback( () => {
		setSelectedAnswer( customOption.id );
	}, [ setSelectedAnswer, customOption.id ] );

	/**
	 * Checks to see if the passed optionId is the currently selected option.
	 *
	 * @param {string} optionId - the optionId to check
	 * @returns {boolean} - true if the passed optionId is the currently selected option
	 */
	const isSelected = optionId => {
		return optionId === selectedAnswer;
	};

	/**
	 * Checks to see if an option is the currently selected option, returns a css class name if it matches.
	 *
	 * @param {string} optionId   - ID of the option to check for.
	 * @returns {string} - The "selected" class if this option is currently selected.
	 */
	const selectedClass = optionId => {
		if ( isSelected( optionId ) ) {
			return 'jp-connect__disconnect-survey-card--selected';
		}

		return '';
	};

	/**
	 * Event handler for keyboard events on the answer blocks.
	 *
	 * @param {string} answerId - The slug of the answer that has been selected.
	 * @param {object} e - Keydown event.
	 */
	const handleAnswerKeyDown = useCallback(
		( answerId, e ) => {
			switch ( e.key ) {
				case 'Enter':
				case 'Space':
				case 'Spacebar':
				case ' ':
					e.preventDefault(); // Don't submit the form when selecting an answer by pressing enter.
					setSelectedAnswer( answerId );
					break;
			}
		},
		[ setSelectedAnswer ]
	);

	/**
	 * Show all the survey options from the options array.
	 *
	 * @returns {React.ElementType []} - Mapped array of rendered survey options.
	 */
	const renderOptions = () => {
		return options.map( option => {
			return (
				<SurveyChoice
					id={ option.id }
					onChange={ setSelectedAnswer }
					onKeyDown={ handleAnswerKeyDown }
					className={ selectedClass( option.id ) }
					isSelected={ isSelected( option.id ) }
					surveyName="jp-disconnect-survey"
					label={ option.answerText }
				/>
			);
		} );
	};

	/**
	 * Show the custom input survey option.
	 * Contains an input field for a custom response.
	 *
	 * @returns {React.ElementType} - The custom survey option with an input field.
	 */
	const renderCustomOption = () => {
		return (
			<SurveyChoice
				id={ customOption.id }
				onChange={ setSelectedAnswer }
				onKeyDown={ handleAnswerKeyDown }
				className={
					'jp-connect__disconnect-survey-card--custom ' + selectedClass( customOption.id )
				}
				isSelected={ isSelected( customOption.id ) }
				surveyName="jp-disconnect-survey"
				label={ __( 'Other:', 'jetpack' ) }
			>
				<p className="jp-connect__disconnect-survey-card__custom-response">
					<label
						className="jp-connect__disconnect-survey-card__custom-response-label"
						htmlFor="jp-feedback-custom-response"
					>
						{ __( 'Custom Feedback:', 'jetpack' ) }{ ' ' }
					</label>
					<input
						id="jp-feedback-custom-response"
						placeholder={ __( 'share your experience', 'jetpack' ) }
						className="jp-connect__disconnect-survey-card__input"
						type="text"
						value={ customResponse }
						onChange={ handleCustomResponse }
						onClick={ setCustomOptionAsSelected }
						maxLength={ 1000 } // Limit response length.
						tabIndex={ isSelected( customOption.id ) ? 0 : -1 } // If this option is not the selected option, remove this input from the tab flow
					/>
				</p>
			</SurveyChoice>
		);
	};

	return (
		<form
			onSubmit={ handleFormSubmit }
			aria-label={ __( 'Jetpack disconnection feedback form', 'jetpack' ) }
			style={ { maxWidth: '100%' } }
		>
			<div className="jp-connection__disconnect-dialog__survey">
				{ renderOptions() }
				{ renderCustomOption() }
			</div>
			<p>
				<Button
					type="submit"
					disabled={ ! selectedAnswer || isSubmittingFeedback }
					isPrimary
					onClick={ handleSurveySubmit }
					className="jp-connection__disconnect-dialog__btn-back-to-wp"
				>
					{ isSubmittingFeedback
						? __( 'Submitting…', 'jetpack' )
						: __( 'Submit Feedback', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
				</Button>
			</p>
		</form>
	);
};

DisconnectSurvey.PropTypes = {
	/** Callback handler function for when the survey response is submitted. */
	onSubmit: PropTypes.func,
	/** If the survey feedback is currently being saved/ submitted */
	isSubmittingFeedback: PropTypes.bool,
};

export default DisconnectSurvey;
