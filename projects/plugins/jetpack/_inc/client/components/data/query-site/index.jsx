import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import {
	fetchAvailablePlans,
	fetchSiteData,
	fetchSiteFeatures,
	fetchSitePurchases,
	isFetchingSiteData,
	getSitePlan,
} from 'state/site';

class QuerySite extends Component {
	static propTypes = {
		isFetchingSiteData: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
		sitePlan: PropTypes.object,
	};

	static defaultProps = {
		isFetchingSiteData: false,
		isOfflineMode: false,
		sitePlan: {},
	};

	UNSAFE_componentWillMount() {
		if (
			! this.props.isFetchingSiteData &&
			! this.props.isOfflineMode &&
			isEmpty( this.props.sitePlan )
		) {
			this.props.fetchSiteData();
			this.props.fetchSiteFeatures();
			this.props.fetchAvailablePlans();
			this.props.fetchSitePurchases();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingSiteData: isFetchingSiteData( state ),
			isOfflineMode: isOfflineMode( state ),
			sitePlan: getSitePlan( state ),
		};
	},
	dispatch => {
		return {
			fetchSiteData: () => dispatch( fetchSiteData() ),
			fetchSiteFeatures: () => dispatch( fetchSiteFeatures() ),
			fetchAvailablePlans: () => dispatch( fetchAvailablePlans() ),
			fetchSitePurchases: () => dispatch( fetchSitePurchases() ),
		};
	}
)( QuerySite );
