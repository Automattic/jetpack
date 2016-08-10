/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	fetchSiteData,
	isFetchingSiteData,
	getSitePlan
} from 'state/site';

export const QuerySite = React.createClass( {
	componentDidMount() {
		if ( ! this.props.isFetchingSiteData ) {
			this.props.fetchSiteData();
		}
	},

	render() {
		return null;
	}
} );

export default connect(
	( state ) => {
		return {
			isFetchingSiteData: isFetchingSiteData( state ),
			siteData: fetchSiteData()
		};
	},
	( dispatch ) => {
		return {
			fetchSiteData: () => dispatch( fetchSiteData() )
		}
	}
)( QuerySite );
