/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	fetchUserConnectionData,
	isFetchingUserData
} from 'state/connection';
import { isDevMode } from 'state/connection';

export const QueryUserConnectionData = React.createClass( {
	componentWillMount() {
		if ( ! ( this.props.isFetchingUserData || this.props.isDevMode ) ) {
			this.props.fetchUserConnectionData();
		}
	},

	render() {
		return null;
	}
} );

export default connect(
	( state ) => {
		return {
			isFetchingUserData: isFetchingUserData( state ),
			isDevMode: isDevMode( state )
		};
	},
	( dispatch ) => {
		return {
			fetchUserConnectionData: () => dispatch( fetchUserConnectionData() )
		}
	}
)( QueryUserConnectionData );
