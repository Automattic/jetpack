/**
 * External dependencies
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getSiteBenefits, getSiteID, getSitePlan, getConnectedPlugins } from 'state/site';
import { isDevVersion } from 'state/initial-state';
import { submitSurvey as submitSurveyAction } from 'state/disconnect-survey/actions';
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import JetpackTerminationDialogFeatures from './features';
import JetpackTerminationDialogSurvey from './survey';
import JetpackTerminationDialogConfirmStep from './confirm';
import JetpackTerminationDialogThankYouStep from './thank-you';
import QuerySite from 'components/data/query-site';
import QuerySiteBenefits from 'components/data/query-site-benefits';
import QueryConnectedPlugins from 'components/data/query-connected-plugins';

function mapBenefitNameToGridicon( benefitName ) {
	switch ( benefitName ) {
		case 'contact-form':
			return 'align-image-center';
		case 'contact-form-feedback':
			return 'mail';
		case 'image-hosting':
			return 'image';
		case 'jetpack-backup':
			return 'cloud-download';
		case 'jetpack-stats':
			return 'stats-alt';
		case 'protect':
			return 'lock';
		case 'publicize':
			return 'share';
		case 'sharing':
			return 'share';
		case 'subscribers':
			return 'user';
		case 'video-hosting':
			return 'video-camera';
		default:
			return 'checkmark';
	}
}

function mapBenefitDataToViewData( benefit ) {
	return {
		name: benefit.name,
		title: benefit.title,
		description: benefit.description,
		amount: benefit.value,
		gridIcon: mapBenefitNameToGridicon( benefit.name ),
	};
}

/*
 * On Jetpack Termination
 *
 * This Dialog is designed to be used from multiple locations with different intents, either
 * disconnecting the Jetpack plugin or uninstalling it. To abstract this we use the word
 * "Termination" to represent both
 */

class JetpackTerminationDialog extends Component {
	static FEATURE_STEP = 'FEATURE_STEP';
	static DISCONNECT_CONFIRM_STEP = 'DISCONNECT_CONFIRM_STEP';
	static SURVEY_STEP = 'SURVEY_STEP';
	static THANK_YOU_STEP = 'THANK_YOU_STEP';

	static steps = [
		JetpackTerminationDialog.FEATURE_STEP,
		JetpackTerminationDialog.DISCONNECT_CONFIRM_STEP,
		JetpackTerminationDialog.SURVEY_STEP,
		JetpackTerminationDialog.THANK_YOU_STEP,
	];

	static propTypes = {
		closeDialog: PropTypes.func.isRequired,
		isDevVersion: PropTypes.bool,
		location: PropTypes.oneOf( [ 'plugins', 'dashboard' ] ).isRequired,
		purpose: PropTypes.oneOf( [ 'disconnect', 'disable' ] ).isRequired,
		showSurvey: PropTypes.bool.isRequired,
		siteBenefits: PropTypes.array,
		submitSurvey: PropTypes.func,
		terminateJetpack: PropTypes.func.isRequired,
		connectedPlugins: PropTypes.array,
	};

	state = {
		step: JetpackTerminationDialog.FEATURE_STEP, // initial step
		surveyAnswerId: null,
		surveyAnswerText: '',
	};

	handleContinueClick = () => {
		const { location, purpose } = this.props;
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_continue_click', {
			location,
			purpose,
		} );
		this.setState( { step: JetpackTerminationDialog.SURVEY_STEP } );
	};

	handleTerminationClick = () => {
		const { location, purpose, siteId, sitePlan, submitSurvey, terminateJetpack } = this.props;
		const { surveyAnswerId, surveyAnswerText } = this.state;
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_termination_click', {
			location,
			purpose,
		} );
		submitSurvey( siteId, sitePlan, surveyAnswerId, surveyAnswerText, location );
		terminateJetpack();
	};

	handleDialogCloseClick = () => {
		const { closeDialog, location, purpose } = this.props;
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_close_click', {
			location,
			purpose,
		} );
		closeDialog();
	};

	// maybe move this into the survey step? Since the survey could be encapsulated?
	handleSurveyAnswerChange = ( surveyAnswerId, surveyAnswerText ) => {
		this.setState( {
			surveyAnswerId,
			surveyAnswerText,
		} );
	};

	handleGoToStep = step_slug => {
		// move to the specified step in the disconnection flow
		if ( JetpackTerminationDialog.steps.indexOf( step_slug ) > -1 ) {
			this.setState( {
				step: step_slug,
			} );
		}
	};

	handleNextStep = () => {
		const currentStepIndex = JetpackTerminationDialog.steps.indexOf( this.state.step );
		if ( currentStepIndex < JetpackTerminationDialog.steps.length - 1 ) {
			this.setState( {
				step: JetpackTerminationDialog.steps[ currentStepIndex + 1 ],
			} );
		}
	};

	handlePreviousStep = () => {
		const currentStepIndex = JetpackTerminationDialog.steps.indexOf( this.state.step );
		if ( currentStepIndex > 0 ) {
			this.setState( {
				step: JetpackTerminationDialog.steps[ currentStepIndex - 1 ],
			} );
		}
	};

	renderFeatures() {
		const { isDevSite: siteIsDev, purpose, siteBenefits, connectedPlugins } = this.props;

		return siteBenefits && connectedPlugins ? (
			<JetpackTerminationDialogFeatures
				isDevSite={ siteIsDev }
				purpose={ purpose }
				siteBenefits={ siteBenefits.map( mapBenefitDataToViewData ) }
				connectedPlugins={ connectedPlugins }
				onClose={ this.props.closeDialog }
				onTerminate={ this.handleNextStep }
				terminateJetpack
			/>
		) : (
			<Card className="jetpack-termination-dialog__spinner">
				<Spinner />
			</Card>
		);
	}

	renderDisconnectConfirm() {
		const { purpose } = this.props;
		return (
			<JetpackTerminationDialogConfirmStep purpose={ purpose } onClose={ this.props.closeDialog } />
		);
	}

	renderSurvey() {
		const { purpose } = this.props;
		const { surveyAnswerId, surveyAnswerText } = this.state;
		return (
			<JetpackTerminationDialogSurvey
				onSurveyAnswerChange={ this.handleSurveyAnswerChange }
				purpose={ purpose }
				surveyAnswerId={ surveyAnswerId }
				surveyAnswerText={ surveyAnswerText }
				onClose={ this.props.closeDialog }
			/>
		);
	}

	renderThankYou() {
		return <JetpackTerminationDialogThankYouStep onClose={ this.props.closeDialog } />;
	}

	// this is temporary to allow for navigation before all steps are completed
	renderNextButton() {
		const currentStepIndex = JetpackTerminationDialog.steps.indexOf( this.state.step );
		if ( currentStepIndex === JetpackTerminationDialog.steps.length - 1 ) {
			return null;
		}

		return <Button onClick={ this.handleNextStep }>{ __( 'Next', 'jetpack' ) }</Button>;
	}

	// this is temporary to allow for navigation before all steps are completed
	renderPreviousButton() {
		const currentStepIndex = JetpackTerminationDialog.steps.indexOf( this.state.step );
		if ( currentStepIndex === 0 ) {
			return null;
		}

		return <Button onClick={ this.handlePreviousStep }>{ __( 'Previous', 'jetpack' ) }</Button>;
	}

	renderCurrentStep() {
		switch ( this.state.step ) {
			case JetpackTerminationDialog.FEATURE_STEP:
				return this.renderFeatures();
			case JetpackTerminationDialog.SURVEY_STEP:
				return this.renderSurvey();
			case JetpackTerminationDialog.DISCONNECT_CONFIRM_STEP:
				return this.renderDisconnectConfirm();
			case JetpackTerminationDialog.THANK_YOU_STEP:
				return this.renderThankYou();
		}
	}

	render() {
		return (
			<div className="jetpack-termination-dialog">
				<QuerySite />
				<QuerySiteBenefits />
				<QueryConnectedPlugins />
				<Card>
					<div className="jetpack-termination-dialog__header">
						<Gridicon
							icon="cross"
							className="jetpack-termination-dialog__close-icon"
							onClick={ this.handleDialogCloseClick }
						/>
					</div>
				</Card>
				{ this.renderCurrentStep() }
				<Card>
					<div className="jetpack-termination-dialog__button-row">
						<p>Temporary buttons for testing</p>
						<div className="jetpack-termination-dialog__button-row-buttons">
							<Button onClick={ this.handleDialogCloseClick }>{ __( 'Cancel', 'jetpack' ) }</Button>
							{ this.renderPreviousButton() }
							{ this.renderNextButton() }
						</div>
					</div>
				</Card>
			</div>
		);
	}
}

export default connect(
	state => ( {
		isDevVersion: isDevVersion( state ),
		siteBenefits: getSiteBenefits( state ),
		siteId: getSiteID( state ),
		sitePlan: getSitePlan( state ),
		connectedPlugins: getConnectedPlugins( state ),
	} ),
	{
		submitSurvey: submitSurveyAction,
	}
)( JetpackTerminationDialog );
