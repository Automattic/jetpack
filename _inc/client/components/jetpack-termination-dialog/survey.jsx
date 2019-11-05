/**
 * External dependencies
 */
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import MultiChoiceQuestion from 'components/multiple-choice-question';

// these answers should line up exactly with the options in Calypso
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

class JetpackTerminationDialogSurvey extends Component {
	static propTypes = {
		onSurveyAnswerChange: PropTypes.func.isRequired,
		surveyAnswerId: PropTypes.string,
		surveyAnswerText: PropTypes.string,
	};

	render() {
		const { onSurveyAnswerChange, surveyAnswerId, surveyAnswerText } = this.props;

		return (
			<Card className="jetpack-disconnect-dialog__survey">
				<MultiChoiceQuestion
					answers={ answers }
					question={ __( "Please let us know why you're disabling Jetpack" ) }
					subHeader={ __( 'Your feedback will help us improve the product.' ) }
					onAnswerChange={ onSurveyAnswerChange }
					selectedAnswerId={ surveyAnswerId }
					selectedAnswerText={ surveyAnswerText }
				/>
			</Card>
		);
	}
}

export default JetpackTerminationDialogSurvey;
