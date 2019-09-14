/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import QuerySiteBenefits from 'components/data/query-site-benefits';
import JetpackDisconnectFeatures from 'components/jetpack-disconnect-dialog/features';
import restApi from 'rest-api';
import { getAkismetData } from 'state/at-a-glance';
import { setInitialState, getApiNonce, getApiRootUrl, getSiteRawUrl } from 'state/initial-state';
import { getSiteBenefits } from 'state/site';

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

class JetpackDisconnectDialogContainer extends React.Component {
	static propTypes = {
		onCloseButtonClick: PropTypes.func,
		onContinueButtonClick: PropTypes.func,
		siteBenefits: PropTypes.object,
		showModalClose: PropTypes.bool,
	};

	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		// this.initializeAnalyitics(); // TODO
	}

	render() {
		const benefits = this.props.siteBenefits || [];

		return (
			<>
				<QuerySite />
				<QuerySiteBenefits />
				<JetpackDisconnectFeatures
					onCloseButtonClick={ this.props.onCloseButtonClick }
					onContinueButtonClick={ this.props.onContinueButtonClick }
					siteBenefits={ benefits.map( mapBenefitDataToViewData ) }
					siteName={ this.props.siteName }
					showModalClose={ this.props.showModalClose }
				>
					{ this.props.children }
				</JetpackDisconnectFeatures>
			</>
		);
	}
}

export default connect(
	state => ( {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		featureBenefitData: {
			spam_blocked: get( getAkismetData( state ), 'all.spam' ),
		},
		siteName: getSiteRawUrl( state ).replace( /:: /g, '/' ),
		siteBenefits: getSiteBenefits( state ),
	} ),
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
	} )
)( JetpackDisconnectDialogContainer );
