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
import QueryAkismetData from 'components/data/query-akismet-data';
import QuerySite from 'components/data/query-site';
import JetpackDisconnect from 'components/jetpack-disconnect-dialog-v2';
import restApi from 'rest-api';
import { getAkismetData } from 'state/at-a-glance';
import { setInitialState, getApiNonce, getApiRootUrl } from 'state/initial-state';
import { getActiveFeatures } from 'state/site';

// Procedure for adding a new feature:
// 1. Add it to the featureWhitelist in the appropriate position.
// 2. If it needs data, add a prop to the object returned by getFeatureBenefitData().
// 3. Add the view data for it to getFeatureHighlightViewData().

// Should be kept as a prioritized list of features we want to highlight
const featureWhitelist = [ 'akismet' ];

// Returns a object mapping features to any props they need
function getFeatureBenefitData( featureBenefitsProps ) {
	return {
		akismet: { number: featureBenefitsProps.spam_blocked },
	};
}

class JetpackDisconnectDialogContainer extends React.Component {
	static propTypes = {
		activeFeatures: PropTypes.array,
	};

	UNSAFE_componentWillMount() {
		this.props.setInitialState();
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		// this.initializeAnalyitics(); // TODO
	}

	render() {
		const featureBenefitData = getFeatureBenefitData( this.props.featureBenefitData );
		const featureHighlights = this.props.activeFeatures
			.filter( feature => featureWhitelist.includes( feature ) )
			.map( feature =>
				feature in featureBenefitData
					? { name: feature, props: featureBenefitData[ feature ] }
					: { name: feature }
			);

		return (
			<div>
				<QuerySite />
				<QueryAkismetData />
				<JetpackDisconnect featureHighlights={ featureHighlights } />
			</div>
		);
	}
}

export default connect(
	state => ( {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
		activeFeatures: getActiveFeatures( state ),
		featureBenefitData: {
			spam_blocked: get( getAkismetData( state ), 'all.spam' ),
		},
	} ),
	dispatch => ( {
		setInitialState: () => {
			return dispatch( setInitialState() );
		},
	} )
)( JetpackDisconnectDialogContainer );
