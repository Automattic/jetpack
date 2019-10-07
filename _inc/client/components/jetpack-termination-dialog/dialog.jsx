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
import { getSiteBenefits } from 'state/site';
import { getSiteRawUrl } from 'state/initial-state';
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import JetpackTerminationDialogFeatures from 'components/jetpack-termination-dialog/features';
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
	static propTypes = {
		closeDialog: PropTypes.func.isRequired,
		disconnectJetpack: PropTypes.func.isRequired,
		location: PropTypes.oneOf( [ 'plugins', 'dashboard' ] ).isRequired,
		purpose: PropTypes.oneOf( [ 'disconnect', 'disable' ] ).isRequired,
		siteBenefits: PropTypes.array,
		siteName: PropTypes.string,
	};

	componentDidMount() {
		const { location, purpose, siteName } = this.props;
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_termination_view', {
			location,
			purpose,
			siteName,
		} );
	}

	handleTerminationClick = () => {
		const { location, purpose, siteName } = this.props;
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_termination_click', {
			location,
			purpose,
			siteName,
		} );
		// TODO: re-enable before shipping
		// this.props.terminateJetpack();
	};

	handleDialogCloseClick = () => {
		const { location, purpose, siteName } = this.props;
		analytics.tracks.recordEvent( 'jetpack_termination_dialog_close_click', {
			location,
			purpose,
			siteName,
		} );
		this.props.closeDialog();
	};

	renderFeatures() {
		const { siteBenefits, siteName } = this.props;

		return siteBenefits ? (
			<JetpackTerminationDialogFeatures
				siteBenefits={ siteBenefits.map( mapBenefitDataToViewData ) }
				siteName={ siteName }
			/>
		) : (
			<Card className="jetpack-termination-dialog__spinner">
				<Spinner size={ 50 } />
			</Card>
		);
	}

	render() {
		const { purpose, location } = this.props;

		return (
			<div className="jetpack-termination-dialog">
				<QuerySite />
				<QuerySiteBenefits />
				<Card>
					<div className="jetpack-termination-dialog__header">
						<h1>
							{ purpose === 'disconnect' ? __( 'Disconnect Jetpack' ) : __( 'Disable Jetpack' ) }
						</h1>
						{ location === 'dashboard' && (
							<Gridicon
								icon="cross"
								className="jetpack-termination-dialog__close-icon"
								onClick={ this.handleDialogCloseClick }
							/>
						) }
					</div>
				</Card>
				{ this.renderFeatures() }
				<Card>
					<div className="jetpack-termination-dialog__button-row">
						<p>
							{ purpose === 'disconnect'
								? __( 'Are you sure you want to disconnect?' )
								: __( 'Are you sure you want to log out and deactivate?' ) }
						</p>
						<div className="jetpack-termination-dialog__button-row-buttons">
							<Button onClick={ this.handleDialogCloseClick }>{ __( 'Close' ) }</Button>
							<Button scary primary onClick={ this.handleTerminationClick }>
								{ purpose === 'disconnect' ? __( 'Disconnect' ) : __( 'Disable' ) }
							</Button>
						</div>
					</div>
				</Card>
			</div>
		);
	}
}

export default connect( state => ( {
	siteName: getSiteRawUrl( state ).replace( /:: /g, '/' ),
	siteBenefits: getSiteBenefits( state ),
} ) )( JetpackTerminationDialog );
