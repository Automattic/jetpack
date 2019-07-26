/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import QueryAkismetData from 'components/data/query-akismet-data';
import QuerySite from 'components/data/query-site';
import QuerySiteBenefits from 'components/data/query-site-benefits';
import JetpackDisconnectFeatures from 'components/jetpack-disconnect-dialog/features';
import restApi from 'rest-api';
import { setInitialState, getApiNonce, getApiRootUrl, getSiteRawUrl } from 'state/initial-state';
import { getFeatureBenefits } from 'state/site';

class JetpackDisconnectDialogContainer extends React.Component {
	static propTypes = {
		onCloseButtonClick: PropTypes.func,
		onContinueButtonClick: PropTypes.func,
		siteBenefits: PropTypes.object,
	};

	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		// this.initializeAnalyitics(); // TODO
	}

	render() {
		return (
			<>
				<QuerySite />
				<QueryAkismetData />
				<QuerySiteBenefits />
				<JetpackDisconnectFeatures
					onCloseButtonClick={ this.props.onCloseButtonClick }
					onContinueButtonClick={ this.props.onContinueButtonClick }
					siteBenefits={ this.props.siteBenefits }
					siteName={ this.props.siteName }
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
		siteName: getSiteRawUrl( state ).replace( /:: /g, '/' ),
		siteBenefits: getFeatureBenefits( state ),
	} ),
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
	} )
)( JetpackDisconnectDialogContainer );
