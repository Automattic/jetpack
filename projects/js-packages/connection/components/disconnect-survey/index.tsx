import { __ } from '@wordpress/i18n';
import { Button, VisuallyHidden } from '@wordpress/ui';
import { Fragment, useCallback, useId, useState } from 'react';
import SurveyChoice from './survey-choice';
import type { ChangeEvent } from 'react';

interface DisconnectSurveyProps {
	/** Callback handler function for when the survey response is submitted. */
	onSubmit?: ( answerId: string, answerText: string ) => void;
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
	// The `name` shared by every radio in the survey, which is what groups them
	// into one radio group. Generated per instance rather than hard-coded, so
	// that two surveys on a page (though unlikely) stay separate groups with unique input IDs.
	const surveyGroupName = `jp-connect__disconnect-survey${ useId() }`;
	const [ selectedAnswer, setSelectedAnswer ] = useState< string >();
	const [ customResponse, setCustomResponse ] = useState( '' );

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
		// The submit button is disabled until an answer is picked.
		if ( ! selectedAnswer ) {
			return;
		}

		const answerText = selectedAnswer === customOption.id ? customResponse : '';
		onSubmit?.( selectedAnswer, answerText );
	}, [ onSubmit, customOption.id, customResponse, selectedAnswer ] );

	/**
	 * Select the "Other" option.
	 *
	 * The free text field sits above the label's hit area. Interacting with the
	 * field is an unambiguous choice of "Other", so it selects the option itself.
	 */
	const selectCustomOption = useCallback( () => {
		setSelectedAnswer( customOption.id );
	}, [ customOption.id, setSelectedAnswer ] );

	/**
	 * Handle input into the custom response field.
	 *
	 * @param {ChangeEvent<HTMLInputElement>} e - onChange event for the custom input
	 */
	const handleCustomResponse = useCallback(
		( e: ChangeEvent< HTMLInputElement > ) => {
			setCustomResponse( e.target.value );
			selectCustomOption();
		},
		[ selectCustomOption, setCustomResponse ]
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
					name={ surveyGroupName }
					label={ option.answerText }
					checked={ selectedAnswer === option.id }
					onSelect={ setSelectedAnswer }
				/>
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
				name={ surveyGroupName }
				label={ __( 'Other:', 'jetpack-connection-js' ) }
				checked={ selectedAnswer === customOption.id }
				onSelect={ setSelectedAnswer }
			>
				<input
					id="jp-connect__disconnect-survey-custom-input"
					name="jp-connect__disconnect-survey-custom-input"
					placeholder={ __( 'Share your experience', 'jetpack-connection-js' ) }
					// Names the option as well as the field: the two are adjacent
					// visually, but nothing otherwise ties this input to the
					// "Other" radio for anyone reading it out of context.
					aria-label={ __( 'Other: share your experience', 'jetpack-connection-js' ) }
					className="jp-connect__disconnect-survey-card__input"
					type="text"
					value={ customResponse }
					onChange={ handleCustomResponse }
					onClick={ selectCustomOption }
					maxLength={ 1000 } // Limit response length.
				/>
			</SurveyChoice>
		);
	};

	return (
		<Fragment>
			<fieldset className="jp-connection__disconnect-dialog__survey">
				<VisuallyHidden render={ <legend /> }>
					{ __( 'Why are you disconnecting?', 'jetpack-connection-js' ) }
				</VisuallyHidden>
				{ renderOptions() }
				{ renderCustomOption() }
			</fieldset>
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
