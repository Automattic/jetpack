/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { userCanConnectAccount } from 'state/initial-state';
import { fetchUserConnectionData, isFetchingUserData } from 'state/connection';

export class QueryUserConnectionData extends React.Component {
	UNSAFE_componentWillMount() {
		if ( this.props.isFetchingUserData || ! this.props.userCanConnectAccount ) {
			return;
		}

		this.props.fetchUserConnectionData();
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingUserData: isFetchingUserData( state ),
			userCanConnectAccount: userCanConnectAccount( state ),
		};
	},
	dispatch => {
		return {
			fetchUserConnectionData: () => dispatch( fetchUserConnectionData() ),
		};
	}
)( QueryUserConnectionData );
