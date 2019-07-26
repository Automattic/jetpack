/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import FeaturesContainer from './container';
import Survey from './survey';

/**
 * Style dependencies
 */
import './style.scss';

const JETPACK_DISCONNECT_INITIAL_STEP = 'jetpack_disconnect_initial_step';
const JETPACK_DISCONNECT_SURVEY_STEP = 'jetpack_disconnect_survey_step';

class JetpackDisconnectDialog extends Component {
	static propTypes = {
		closeDialog: PropTypes.func.isRequired,
		disconnectJetpack: PropTypes.func.isRequired,
	};

	constructor( props ) {
		super( props );

		this.state = { step: JETPACK_DISCONNECT_INITIAL_STEP };
		this.handleFeaturesContinueClick = this.handleFeaturesContinueClick.bind( this );
		this.handleSurveyAnswerChange = this.handleSurveyAnswerChange.bind( this );
	}

	handleFeaturesContinueClick() {
		this.setState( {
			step: JETPACK_DISCONNECT_SURVEY_STEP,
			surveyAnswerId: null,
			surveyAnswerText: '',
		} );
	}

	handleSurveyAnswerChange( surveyAnswerId, surveyAnswerText ) {
		this.setState( {
			surveyAnswerId,
			surveyAnswerText,
		} );
	}

	renderInitialStep() {
		return (
			<FeaturesContainer
				onContinueButtonClick={ this.handleFeaturesContinueClick }
				onCloseButtonClick={ this.props.closeDialog }
			/>
		);
	}

	renderSurveyStep() {
		const { surveyAnswerId, surveyAnswerText } = this.state;

		return (
			<Survey
				onDisconnectButtonClick={ this.props.disconnectJetpack }
				onSurveyAnswerChange={ this.handleSurveyAnswerChange }
				surveyAnswerId={ surveyAnswerId }
				surveyAnswerText={ surveyAnswerText }
			/>
		);
	}

	render() {
		const { step } = this.state;
		return JETPACK_DISCONNECT_SURVEY_STEP === step
			? this.renderSurveyStep()
			: this.renderInitialStep();
	}
}

export default JetpackDisconnectDialog;
