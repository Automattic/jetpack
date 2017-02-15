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
	isFetchingSiteData
} from 'state/site';
import { isDevMode } from 'state/connection';

export const QuerySite = React.createClass( {
	componentDidMount() {
		if ( ! ( this.props.isFetchingSiteData || this.props.isDevMode ) ) {
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
			isDevMode: isDevMode( state )
		};
	},
	( dispatch ) => {
		return {
			fetchSiteData: () => dispatch( fetchSiteData() )
		}
	}
)( QuerySite );
