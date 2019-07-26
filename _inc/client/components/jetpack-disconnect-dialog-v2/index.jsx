/**
 * External dependencies
 */
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
	constructor( props ) {
		super( props );

		this.state = { step: JETPACK_DISCONNECT_INITIAL_STEP };
		this.handleCloseButtonClick = this.handleCloseButtonClick.bind( this );
		this.handleFeaturesContinueClick = this.handleFeaturesContinueClick.bind( this );
		this.handleSurveyDisableClick = this.handleSurveyDisableClick.bind( this );
	}

	handleFeaturesContinueClick() {
		this.setState( {
			step: JETPACK_DISCONNECT_SURVEY_STEP,
		} );
	}

	handleSurveyDisableClick() {
		if ( parent.deactivateJetpack ) {
			parent.deactivateJetpack();
		}
	}

	handleCloseButtonClick() {
		if ( parent.tb_remove ) {
			parent.tb_remove();
		}
	}

	renderInitialStep() {
		return (
			<FeaturesContainer
				onContinueButtonClick={ this.handleFeaturesContinueClick }
				onCloseButtonClick={ this.handleCloseButtonClick }
			/>
		);
	}

	renderSurveyStep() {
		return <Survey onDisconnectButtonClick={ this.handleSurveyDisableClick } />;
	}

	render() {
		const { step } = this.state;
		return JETPACK_DISCONNECT_SURVEY_STEP === step
			? this.renderSurveyStep()
			: this.renderInitialStep();
	}
}

export default JetpackDisconnectDialog;
