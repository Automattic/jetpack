/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchConnectUrl, isFetchingConnectUrl, isDevMode } from 'state/connection';

export class QueryConnectUrl extends React.Component {
	UNSAFE_componentWillMount() {
		if ( ! ( this.props.isFetchingConnectUrl || this.props.isDevMode ) ) {
			this.props.fetchConnectUrl();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingConnectUrl: isFetchingConnectUrl( state ),
			isDevMode: isDevMode( state ),
		};
	},
	dispatch => {
		return {
			fetchConnectUrl: () => dispatch( fetchConnectUrl() ),
		};
	}
)( QueryConnectUrl );
