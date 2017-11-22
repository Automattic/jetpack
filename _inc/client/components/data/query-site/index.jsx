/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';

/**
 * Internal dependencies
 */
import {
	fetchSiteData,
	fetchSiteFeatures,
	isFetchingSiteData,
	getSitePlan
} from 'state/site';
import { isDevMode } from 'state/connection';

class QuerySite extends Component {
	static propTypes = {
		isFetchingSiteData: PropTypes.bool,
		isDevMode: PropTypes.bool,
		sitePlan: PropTypes.object
	};

	static defaultProps = {
		isFetchingSiteData: false,
		isDevMode: false,
		sitePlan: {}
	};

	componentWillMount() {
		if ( ! this.props.isFetchingSiteData && ! this.props.isDevMode && isEmpty( this.props.sitePlan ) ) {
			this.props.fetchSiteData();
			this.props.fetchSiteFeatures();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	( state ) => {
		return {
			isFetchingSiteData: isFetchingSiteData( state ),
			isDevMode: isDevMode( state ),
			sitePlan: getSitePlan( state )
		};
	},
	( dispatch ) => {
		return {
			fetchSiteData: () => dispatch( fetchSiteData() ),
			fetchSiteFeatures: () => dispatch( fetchSiteFeatures() )
		};
	}
)( QuerySite );
