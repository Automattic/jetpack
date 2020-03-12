/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import { getSiteBenefits, getSiteID, getSitePlan } from 'state/site';
import { isDevVersion } from 'state/initial-state';
import { submitSurvey as submitSurveyAction } from 'state/disconnect-survey/actions';
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import JetpackTerminationDialogFeatures from './features';
import JetpackTerminationDialogSurvey from './survey';
import QuerySite from 'components/data/query-site';
import QuerySiteBenefits from 'components/data/query-site-benefits';
import Spinner from 'components/spinner';

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
	static SURVEY_STEP = 'SURVEY_STEP';

	static propTypes = {
		closeDialog: PropTypes.func.isRequired,
		isDevVersion: PropTypes.bool,
		location: PropTypes.oneOf( [ 'plugins', 'dashboard' ] ).isRequired,
		purpose: PropTypes.oneOf( [ 'disconnect', 'disable' ] ).isRequired,
		siteBenefits: PropTypes.array,
		submitSurvey: PropTypes.func,
		terminateJetpack: PropTypes.func.isRequired,
	};

	state = {
		step: JetpackTerminationDialog.FEATURE_STEP,
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

	handleSurveyAnswerChange = ( surveyAnswerId, surveyAnswerText ) => {
		this.setState( {
			surveyAnswerId,
			surveyAnswerText,
		} );
	};

	renderFeatures() {
		const { isDevSite: siteIsDev, purpose, siteBenefits } = this.props;

		return siteBenefits ? (
			<JetpackTerminationDialogFeatures
				isDevSite={ siteIsDev }
				purpose={ purpose }
				siteBenefits={ siteBenefits.map( mapBenefitDataToViewData ) }
			/>
		) : (
			<Card className="jetpack-termination-dialog__spinner">
				<Spinner />
			</Card>
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
			/>
		);
	}

	renderPrimaryButton() {
		const { purpose } = this.props;
		const { step } = this.state;
		return step === JetpackTerminationDialog.FEATURE_STEP ? (
			<Button primary onClick={ this.handleContinueClick }>
				{ __( 'Continue' ) }
			</Button>
		) : (
			<Button scary primary onClick={ this.handleTerminationClick }>
				{ purpose === 'disconnect' ? __( 'Disconnect' ) : __( 'Disable' ) }
			</Button>
		);
	}

	render() {
		const { purpose, location } = this.props;
		const { step } = this.state;

		return (
			<div className="jetpack-termination-dialog">
				<QuerySite />
				<QuerySiteBenefits />
				<Card>
					<div className="jetpack-termination-dialog__header">
						<h2>
							{ purpose === 'disconnect' ? __( 'Disconnect Jetpack' ) : __( 'Disable Jetpack' ) }
						</h2>
						{ location === 'dashboard' && (
							<Gridicon
								icon="cross"
								className="jetpack-termination-dialog__close-icon"
								onClick={ this.handleDialogCloseClick }
							/>
						) }
					</div>
				</Card>
				{ step === JetpackTerminationDialog.FEATURE_STEP
					? this.renderFeatures()
					: this.renderSurvey() }
				<Card>
					<div className="jetpack-termination-dialog__button-row">
						<p>
							{ purpose === 'disconnect'
								? __( 'Are you sure you want to disconnect?' )
								: __( 'Are you sure you want to disconnect and deactivate?' ) }
						</p>
						<div className="jetpack-termination-dialog__button-row-buttons">
							<Button onClick={ this.handleDialogCloseClick }>{ __( 'Cancel' ) }</Button>
							{ this.renderPrimaryButton() }
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
	} ),
	{
		submitSurvey: submitSurveyAction,
	}
)( JetpackTerminationDialog );
