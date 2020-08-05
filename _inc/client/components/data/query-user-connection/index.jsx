/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchUserConnectionData, isFetchingUserData, isOfflineMode } from 'state/connection';

export class QueryUserConnectionData extends React.Component {
	UNSAFE_componentWillMount() {
		if ( ! ( this.props.isFetchingUserData || this.props.isOfflineMode ) ) {
			this.props.fetchUserConnectionData();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingUserData: isFetchingUserData( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchUserConnectionData: () => dispatch( fetchUserConnectionData() ),
		};
	}
)( QueryUserConnectionData );
