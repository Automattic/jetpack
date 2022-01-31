/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import MultiChoiceQuestion from 'components/multiple-choice-question';

// these answers should line up exactly with the options in Calypso
// see any changes at
// https://github.com/Automattic/wp-calypso/blob/master/client/my-sites/site-settings/disconnect-site/confirm.jsx
const answers = [
	{ id: 'cannot-work', answerText: __( "I can't get it to work.", 'jetpack' ) },
	{ id: 'slow', answerText: __( 'It slowed down my site.', 'jetpack' ) },
	{ id: 'buggy', answerText: __( "It's buggy.", 'jetpack' ) },
	{ id: 'no-clarity', answerText: __( "I don't know what it does.", 'jetpack' ) },
	{ id: 'delete', answerText: __( "I'm deleting/migrating my site.", 'jetpack' ) },
	{
		id: 'troubleshooting',
		answerText: __( "Troubleshooting - I'll be reconnecting afterwards.", 'jetpack' ),
	},
	{
		id: 'other',
		answerText: __( 'Other:', 'jetpack' ),
		textInput: true,
		textInputPrompt: __( 'share your experience', 'jetpack' ),
		doNotShuffle: true,
	},
];

class JetpackTerminationDialogSurvey extends Component {
	static propTypes = {
		onSurveyAnswerChange: PropTypes.func.isRequired,
		purpose: PropTypes.oneOf( [ 'disconnect', 'disable' ] ).isRequired,
		surveyAnswerId: PropTypes.string,
		surveyAnswerText: PropTypes.string,
	};

	getQuestion() {
		const { purpose } = this.props;
		return 'disconnect' === purpose
			? __( "Please let us know why you're disconnecting Jetpack", 'jetpack' )
			: __( "Please let us know why you're disabling Jetpack", 'jetpack' );
	}

	render() {
		const { onSurveyAnswerChange, surveyAnswerId, surveyAnswerText } = this.props;

		return (
			<Card className="jetpack-disconnect-dialog__survey">
				<MultiChoiceQuestion
					answers={ answers }
					question={ this.getQuestion() }
					subHeader={ __( 'Your feedback will help us improve the product.', 'jetpack' ) }
					onAnswerChange={ onSurveyAnswerChange }
					selectedAnswerId={ surveyAnswerId }
					selectedAnswerText={ surveyAnswerText }
				/>
			</Card>
		);
	}
}

export default JetpackTerminationDialogSurvey;
