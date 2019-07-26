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
	{ id: 'too-confusing', answerText: __( 'It was too hard to configure Jetpack.' ) },
	{ id: 'missing-feature', answerText: __( 'A feature I needed was missing.' ) },
	{ id: 'too-expensive', answerText: __( 'This plan is too expensive.' ) },
	{ id: 'troubleshooting', answerText: __( "Troubleshooting - I'll be reconnecting afterwards." ) },
	{
		id: 'another-reason',
		answerText: 'Another reason:',
		textInput: true,
		textInputPrompt: 'share your experience',
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
					question={ 'Please choose one of the following:' }
					onAnswerChange={ onSurveyAnswerChange }
					selectedAnswerId={ surveyAnswerId }
					selectedAnswerText={ surveyAnswerText }
				/>
				<div className="jetpack-disconnect-dialog__button-row">
					<Button scary onClick={ onDisconnectButtonClick }>
						{ __( 'Disconnect' ) }
					</Button>
				</div>
			</Card>
		</div>
	);
};
export default JetpackDisconnectDialogSurvey;
