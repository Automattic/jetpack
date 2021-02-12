/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	isFetchingConnectUrl as _isFetchingConnectUrl,
	getConnectUrl as _getConnectUrl,
	fetchUserConnectionData,
	authorizeUserInPlaceSuccess,
	isAuthorizingUserInPlace,
	hasConnectedOwner,
} from 'state/connection';
import { InPlaceConnection } from '@automattic/jetpack-connection';

export class AuthIframe extends React.Component {
	static displayName = 'AuthIframe';

	static propTypes = {
		title: PropTypes.string.isRequired,
		height: PropTypes.string,
		width: PropTypes.string,
		scrollToIframe: PropTypes.bool,
		onAuthorized: PropTypes.func,
		hasConnectedOwner: PropTypes.bool,
	};

	static defaultProps = {
		title: __( 'Connect your WordPress.com account', 'jetpack' ),
		height: '220',
		width: '100%',
		scrollToIframe: true,
		onAuthorized: noop,
	};

	onComplete = () => {
		// Dispatch successful authorization.
		this.props.authorizeUserInPlaceSuccess();

		// Fetch user connection data after successful authorization to trigger state refresh
		// for linked user.
		this.props.fetchUserConnectionData();

		// Trigger 'onAuthorized' callback, if provided
		this.props.onAuthorized();
	};

	render = () => {
		return (
			<InPlaceConnection
				connectUrl={ this.props.connectUrl }
				height={ this.props.height }
				width={ this.props.width }
				isLoading={ this.props.fetchingConnectUrl }
				title={ this.props.title }
				hasConnectedOwner={ this.props.hasConnectedOwner }
				scrollToIframe={ this.props.scrollToIframe }
				onComplete={ this.onComplete }
			/>
		);
	};
}

export default connect(
	state => {
		return {
			fetchingConnectUrl: _isFetchingConnectUrl( state ),
			connectUrl: _getConnectUrl( state ),
			isAuthorizingInPlace: isAuthorizingUserInPlace( state ),
			hasConnectedOwner: hasConnectedOwner( state ),
		};
	},
	dispatch => {
		return {
			fetchUserConnectionData: () => {
				return dispatch( fetchUserConnectionData() );
			},
			authorizeUserInPlaceSuccess: () => {
				return dispatch( authorizeUserInPlaceSuccess() );
			},
		};
	}
)( AuthIframe );
