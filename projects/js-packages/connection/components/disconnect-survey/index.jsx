import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
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
	 * Handle input into the custom response field.
	 *
	 * @param {object} e - onChange event for the custom input
	 */
	const handleCustomResponse = useCallback(
		e => {
			const value = e.target.value;
			e.stopPropagation();
			setCustomResponse( value );
		},
		[ setCustomResponse ]
	);

	/**
	 * Checks to see if an option is the currently selected option, returns a css class name if it matches.
	 *
	 * @param {string} optionId   - ID of the option to check for.
	 * @returns {string} - The "selected" class if this option is currently selected.
	 */
	const selectedClass = optionId => {
		if ( optionId === selectedAnswer ) {
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
					onClick={ setSelectedAnswer }
					onKeyDown={ handleAnswerKeyDown }
					className={ 'card jp-connect__disconnect-survey-card ' + selectedClass( option.id ) }
				>
					<p className="jp-connect__disconnect-survey-card__answer">{ option.answerText }</p>
				</SurveyChoice>
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
				onClick={ setSelectedAnswer }
				onKeyDown={ handleAnswerKeyDown }
				className={ 'card jp-connect__disconnect-survey-card ' + selectedClass( customOption.id ) }
			>
				<p className="jp-connect__disconnect-survey-card__answer">
					{ __( 'Other:', 'jetpack' ) }{ ' ' }
					<input
						placeholder={ __( 'share your experience', 'jetpack' ) }
						className="jp-connect__disconnect-survey-card__input"
						type="text"
						value={ customResponse }
						onChange={ handleCustomResponse }
						maxLength={ 1000 } // Limit response length.
					/>
				</p>
			</SurveyChoice>
		);
	};

	return (
		<React.Fragment>
			<div className="jp-connection__disconnect-dialog__survey">
				{ renderOptions() }
				{ renderCustomOption() }
			</div>
			<p>
				<Button
					disabled={ ! selectedAnswer || isSubmittingFeedback }
					variant="primary"
					onClick={ handleSurveySubmit }
					className="jp-connection__disconnect-dialog__btn-back-to-wp"
				>
					{ isSubmittingFeedback
						? __( 'Submitting…', 'jetpack' )
						: __( 'Submit Feedback', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
				</Button>
			</p>
		</React.Fragment>
	);
};

DisconnectSurvey.PropTypes = {
	/** Callback handler function for when the survey response is submitted. */
	onSubmit: PropTypes.func,
	/** If the survey feedback is currently being saved/ submitted */
	isSubmittingFeedback: PropTypes.bool,
};

export default DisconnectSurvey;
