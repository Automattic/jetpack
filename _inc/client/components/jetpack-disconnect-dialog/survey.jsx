/**
 * External dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import MultiChoiceQuestion from 'components/multiple-choice-question';

const answers = [
	{ id: 'cannot-work', answerText: __( "I can't get it to work." ) },
	{ id: 'slow', answerText: __( 'It slowed down my site.' ) },
	{ id: 'buggy', answerText: __( "It's buggy." ) },
	{ id: 'no-clarity', answerText: __( "I don't know what it does." ) },
	{ id: 'delete', answerText: __( "I'm deleting/migrating my site." ) },
	{ id: 'troubleshooting', answerText: __( "Troubleshooting - I'll be reconnecting afterwards." ) },
	{
		id: 'other',
		answerText: 'Other:',
		textInput: true,
		textInputPrompt: 'share your experience',
		doNotShuffle: true,
	},
];

const JetpackDisconnectDialogSurvey = ( {
	onDisconnectButtonClick,
	onSurveyAnswerChange,
	surveyAnswerId,
	surveyAnswerText,
} ) => {
	return (
		<div className="jetpack-disconnect-dialog__survey">
			<Card>
				<h1 className="jetpack-disconnect-dialog__header">{ __( 'Disable Jetpack' ) }</h1>
			</Card>
			<Card>
				<MultiChoiceQuestion
					answers={ answers }
					question={ __( "Please let us know why you're disabling Jetpack" ) }
					subHeader={ __( 'Your feedback will help us improve the product.' ) }
					onAnswerChange={ onSurveyAnswerChange }
					selectedAnswerId={ surveyAnswerId }
					selectedAnswerText={ surveyAnswerText }
				/>
			</Card>
			<Card>
				<div className="jetpack-disconnect-dialog__button-row">
					<p>
						{ __( 'Have a question?' ) } <a href="">{ __( " Let's Talk. " ) }</a>
					</p>
					<Button scary onClick={ onDisconnectButtonClick }>
						{ __( 'Disconnect' ) }
					</Button>
				</div>
			</Card>
		</div>
	);
};
export default JetpackDisconnectDialogSurvey;
