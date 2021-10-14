/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

/**
 * External Dependencies
 */
import React, { useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import '../_jp-disconnect-survey-card.scss';

/**
 * Show the survey step and allow the user to select a response.
 *
 * @param {Function} props.onExit - Callback function used to close the modal and leave the disconnect flow.
 * @param {Function} props.onFeedbackProvided - Callback function to handle submission of survey repsonse.
 * @returns {React.Component} The StepSurvey Component
 */

const StepSurvey = props => {
	const { onExit, onFeedBackProvided } = props;
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
		onFeedBackProvided( selectedAnswer, answerText );
	}, [ onFeedBackProvided, customOption.id, customResponse, selectedAnswer ] );

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
			return 'jp-disconnect-survey-card--selected';
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
					className={ 'card jp-disconnect-survey-card ' + selectedClass( option.id ) }
				>
					<p className="jp-disconnect-survey-card__answer">{ option.answerText }</p>
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
				className={ 'card jp-disconnect-survey-card ' + selectedClass( customOption.id ) }
			>
				<p className="jp-disconnect-survey-card__answer">
					Other:{ ' ' }
					<input
						placeholder="share your experience"
						className="jp-disconnect-survey-card__input"
						type="text"
						value={ customResponse }
						onChange={ handleCustomResponse }
					/>
				</p>
			</SurveyChoice>
		);
	};

	return (
		<div className="jp-disconnect-dialog__content">
			<h1>{ __( 'Before you go, help us improve Jetpack' ) }</h1>
			<p className="jp-disconnect-dialog__large-text">
				{ __( 'Let us know what didn‘t work for you', 'jetpack' ) }
			</p>
			<div className="jp-disconnect-dialog__survey">
				{ renderOptions() }
				{ renderCustomOption() }
			</div>
			<p>
				<Button
					disabled={ ! selectedAnswer }
					isPrimary
					onClick={ handleSurveySubmit }
					className="jp-disconnect-dialog__btn-back-to-wp"
				>
					{ __( 'Submit Feedback', 'jetpack' ) }
				</Button>
			</p>
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

/**
 * SurveyChoice - Present one choice in the survey.
 *
 * @param {string} props.id - The ID/slug string of the survey option
 * @param {Function} props.onClick - Event handler for clicking on the survey option.
 * @param {Function} props.onKeydown - Event handler for pressing a key on the survey option.
 * @param {React.ElementType} props.children - Any passed elements as children to this component.
 * @param {string} props.className - A class name to apply to the survey choice.
 * @returns {React.Component} SurveyChoice - The SurveyChoice component.
 */

const SurveyChoice = props => {
	const { id, onClick, onKeyDown, children, className } = props;

	const handleClick = useCallback( () => {
		onClick( id );
	}, [ id, onClick ] );

	const handleKeyDown = useCallback(
		e => {
			onKeyDown( id, e );
		},
		[ id, onKeyDown ]
	);

	return (
		<div
			tabIndex="0"
			role="button"
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			className={ 'card jp-disconnect-survey-card ' + className }
		>
			{ children }
		</div>
	);
};

export default StepSurvey;
