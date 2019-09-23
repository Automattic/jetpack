/**
 * External dependencies
 */
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import { getSiteBenefits } from 'state/site';
import { getSiteRawUrl } from 'state/initial-state';
import JetpackTerminationDialogFeatures from 'components/jetpack-termination-dialog/features';
import QuerySite from 'components/data/query-site';
import QuerySiteBenefits from 'components/data/query-site-benefits';

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
		purpose: PropTypes.oneOf( [ 'disconnect', 'uninstall' ] ).isRequired,
		siteBenefits: PropTypes.object,
	};

	static defaultProps = {
		siteBenefits: [],
	};

	handleJetpackTermination() {
		this.props.terminateJetpack();
	}

	renderFeatures() {
		const { closeDialog, location, siteBenefits, purpose, siteName } = this.props;

		return (
			<JetpackTerminationDialogFeatures
				onCloseButtonClick={ closeDialog }
				onTerminateButtonClick={ this.handleJetpackTermination }
				showModalClose={ 'dashboard' === location }
				siteBenefits={ siteBenefits.map( mapBenefitDataToViewData ) }
				siteName={ siteName }
				purpose={ purpose }
			/>
		);
	}

	render() {
		return (
			<>
				<QuerySite />
				<QuerySiteBenefits />
				{ this.renderFeatures() }
			</>
		);
	}
}

export default connect( state => ( {
	siteName: getSiteRawUrl( state ).replace( /:: /g, '/' ),
	siteBenefits: getSiteBenefits( state ),
} ) )( JetpackTerminationDialog );
