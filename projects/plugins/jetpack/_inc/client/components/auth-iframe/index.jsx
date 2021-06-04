/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { __ } from '@wordpress/i18n';
import { PopUpConnection } from '@automattic/jetpack-connection';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';

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
	isSiteRegistered,
} from 'state/connection';

export class AuthIframe extends React.Component {
	static displayName = 'AuthIframe';

	static propTypes = {
		title: PropTypes.string.isRequired,
		height: PropTypes.string,
		width: PropTypes.string,
		scrollTo: PropTypes.bool,
		onAuthorized: PropTypes.func,
		displayTOS: PropTypes.bool,
		location: PropTypes.string,
	};

	static defaultProps = {
		title: __( 'Connect your WordPress.com account', 'jetpack' ),
		height: '330',
		width: '100%',
		scrollTo: true,
		onAuthorized: noop,
	};

	/**
	 * Authentication completed, adjust the state.
	 */
	onClosed = () => {
		// Fetch user connection data after successful authorization to trigger state refresh
		// for linked user.
		this.props
			.fetchUserConnectionData()
			.then( connectionData => {
				console.warn( 'got connection data', connectionData );

				// if we aren't connected after the popup closes
				// then let's let the user know they didn't finish connecting
				if ( ! connectionData.connectionOwner ) {
					this.props.warnNotConnected();
					return; // later: show warning?
				}

				// Dispatch successful authorization.
				this.props.authorizeUserInPlaceSuccess();

				// Trigger 'onAuthorized' callback, if provided
				this.props.onAuthorized();
			} )
			.catch( err => {
				console.error( 'got connection error', err );
			} );
	};

	render = () => {
		return (
			<PopUpConnection
				connectUrl={ this.props.connectUrl }
				height={ this.props.height }
				width={ this.props.width }
				isLoading={ this.props.fetchingConnectUrl }
				title={ this.props.title }
				displayTOS={ this.props.displayTOS }
				scrollTo={ this.props.scrollTo }
				onClosed={ this.onClosed }
				location={ this.props.location }
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
			displayTOS: hasConnectedOwner( state ) || isSiteRegistered( state ), // Display TOS in site connection mode and for secondary users.
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
			warnNotConnected: () => {
				return dispatch(
					createNotice( 'is-warning', __( 'Not Connected' ), { id: 'NOTICE_NOT_CONNECTED' } )
				);
			},
		};
	}
)( AuthIframe );
