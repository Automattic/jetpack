import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { Fragment, useCallback, useState } from 'react';
import SurveyChoiceComponent from './survey-choice';
import type { ChangeEvent, ComponentType, KeyboardEvent, ReactNode } from 'react';

// survey-choice.jsx is untyped and its JSDoc types its return as a class Component, which is not a
// valid JSX element type. Cast to a typed function component for the props this file passes.
const SurveyChoice = SurveyChoiceComponent as unknown as ComponentType< {
	id: string;
	onClick: ( id: string ) => void;
	onKeyDown: ( answerId: string, e: KeyboardEvent< HTMLDivElement > ) => void;
	className: string;
	children?: ReactNode;
} >;

interface DisconnectSurveyProps {
	/** Callback handler function for when the survey response is submitted. */
	onSubmit: ( answerId: string | undefined, answerText: string ) => void;
	/** If the survey feedback is currently being saved/ submitted. */
	isSubmittingFeedback?: boolean;
}

/**
 * Handles showing the disconnect survey.
 *
 * @param {DisconnectSurveyProps} props - The component props.
 * @return {import('react').ReactNode} - DisconnectSurvey component.
 */
const DisconnectSurvey = ( props: DisconnectSurveyProps ) => {
	const { onSubmit, isSubmittingFeedback } = props;
	const [ selectedAnswer, setSelectedAnswer ] = useState< string >();
	const [ customResponse, setCustomResponse ] = useState< string >();

	const options = [
		{
			id: 'troubleshooting',
			answerText: __(
				"Troubleshooting - I'll be reconnecting afterwards.",
				'jetpack-connection-js'
			),
		},
		{
			id: 'not-working',
			answerText: __( "I can't get it to work.", 'jetpack-connection-js' ),
		},
		{
			id: 'slowed-down-site',
			answerText: __( 'It slowed down my site.', 'jetpack-connection-js' ),
		},
		{
			id: 'buggy',
			answerText: __( "It's buggy.", 'jetpack-connection-js' ),
		},
		{
			id: 'what-does-it-do',
			answerText: __( "I don't know what it does.", 'jetpack-connection-js' ),
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
	 * @param {ChangeEvent<HTMLInputElement>} e - onChange event for the custom input
	 */
	const handleCustomResponse = useCallback(
		( e: ChangeEvent< HTMLInputElement > ) => {
			const value = e.target.value;
			e.stopPropagation();
			setCustomResponse( value );
		},
		[ setCustomResponse ]
	);

	/**
	 * Checks to see if an option is the currently selected option, returns a css class name if it matches.
	 *
	 * @param {string} optionId - ID of the option to check for.
	 * @return {string} - The "selected" class if this option is currently selected.
	 */
	const selectedClass = ( optionId: string ) => {
		if ( optionId === selectedAnswer ) {
			return 'jp-connect__disconnect-survey-card--selected';
		}

		return '';
	};

	/**
	 * Event handler for keyboard events on the answer blocks.
	 *
	 * @param {string}                        answerId - The slug of the answer that has been selected.
	 * @param {KeyboardEvent<HTMLDivElement>} e        - Keydown event.
	 */
	const handleAnswerKeyDown = useCallback(
		( answerId: string, e: KeyboardEvent< HTMLDivElement > ) => {
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
	 * @return {import('react').ReactNode []} - Mapped array of rendered survey options.
	 */
	const renderOptions = () => {
		return options.map( option => {
			return (
				<SurveyChoice
					key={ option.id }
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
	 * @return {import('react').ReactNode} - The custom survey option with an input field.
	 */
	const renderCustomOption = () => {
		return (
			<SurveyChoice
				id={ customOption.id }
				key={ customOption.id }
				onClick={ setSelectedAnswer }
				onKeyDown={ handleAnswerKeyDown }
				className={ 'card jp-connect__disconnect-survey-card ' + selectedClass( customOption.id ) }
			>
				<p className="jp-connect__disconnect-survey-card__answer">
					{ __( 'Other:', 'jetpack-connection-js' ) }{ ' ' }
					<input
						placeholder={ __( 'share your experience', 'jetpack-connection-js' ) }
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
		<Fragment>
			<div className="jp-connection__disconnect-dialog__survey">
				{ renderOptions() }
				{ renderCustomOption() }
			</div>
			<p>
				<Button
					disabled={ ! selectedAnswer || isSubmittingFeedback }
					onClick={ handleSurveySubmit }
					className="jp-connection__disconnect-dialog__btn-back-to-wp"
				>
					{ isSubmittingFeedback
						? __( 'Submitting…', 'jetpack-connection-js' )
						: __(
								'Submit Feedback',
								'jetpack-connection-js',
								// @ts-expect-error Dummy arg to avoid bad minification; ignored at runtime.
								0
						  ) }
				</Button>
			</p>
		</Fragment>
	);
};

export default DisconnectSurvey;
