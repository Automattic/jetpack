/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	fetchConnectUrl,
	isFetchingConnectUrl
} from 'state/connection';
import { isDevMode } from 'state/connection';

export const QueryConnectUrl = React.createClass( {
	componentWillMount() {
		if ( ! ( this.props.isFetchingConnectUrl || this.props.isDevMode ) ) {
			this.props.fetchConnectUrl();
		}
	},

	render() {
		return null;
	}
} );

export default connect(
	( state ) => {
		return {
			isFetchingConnectUrl: isFetchingConnectUrl( state ),
			isDevMode: isDevMode( state )
		};
	},
	( dispatch ) => {
		return {
			fetchConnectUrl: () => dispatch( fetchConnectUrl() )
		}
	}
)( QueryConnectUrl );
