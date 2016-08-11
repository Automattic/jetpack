/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	getSiteConnectionStatus as _getSiteConnectionStatus,
	disconnectSite,
	isDisconnectingSite as _isDisconnectingSite,
	isFetchingConnectUrl as _isFetchingConnectUrl,
	getConnectUrl as _getConnectUrl,
	unlinkUser,
	isCurrentUserLinked as _isCurrentUserLinked,
	isUnlinkingUser as _isUnlinkingUser
} from 'state/connection';
import QueryConnectUrl from 'components/data/query-connect-url';


const ConnectButton = React.createClass( {
	displayName: 'ConnectButton',

	propTypes: {
		type: React.PropTypes.bool
	},

	getDefaultProps() {
		return {
			connectUser: false
		};
	},

	renderUserButton: function() {
		const fetchingUrl = this.props.fetchingConnectUrl( this.props );
		const isUnlinking = this.props.isUnlinking( this.props );

		// Already linked
		if ( this.props.isLinked( this.props ) ) {
			return(
				<div>
					<Button
						onClick={ this.props.unlinkUser }
						disabled={ isUnlinking } >
						{ __( 'Unlink me from WordPress.com' ) }
					</Button>
				</div>
			);
		}

		return(
			<Button
				className="is-primary jp-jetpack-connect__button"
				href={ this.props.connectUrl( this.props ) }
				disabled={ fetchingUrl } >
				{ __( 'Link to WordPress.com' ) }
			</Button>
		);
	},

	disconnectSite() {
		if ( window.confirm( __( 'Do you really want to disconnect your site from WordPress.com?' ) ) ) {
			this.props.disconnectSite();
		}
	},

	renderContent: function() {
		const fetchingUrl = this.props.fetchingConnectUrl( this.props );
		const disconnecting = this.props.isDisconnecting( this.props );

		if ( this.props.connectUser ) {
			return this.renderUserButton();
		}

		if ( this.props.isSiteConnected( this.props ) ) {
			return(
				<Button
					onClick={ this.disconnectSite }
					disabled={ disconnecting }>
					{ __( 'Disconnect Jetpack') }
				</Button>
			);
		}

		return(
			<Button
				className="is-primary jp-jetpack-connect__button"
				href={ this.props.connectUrl( this.props ) }
				disabled={ fetchingUrl }>
				{ __( 'Connect Jetpack' ) }
			</Button>
		);
	},

	render() {
		return (
			<div>
				<QueryConnectUrl />
				{ this.renderContent() }
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			isSiteConnected: () => _getSiteConnectionStatus( state ),
			isDisconnecting: () => _isDisconnectingSite( state ),
			fetchingConnectUrl: () => _isFetchingConnectUrl( state ),
			connectUrl: () => _getConnectUrl( state ),
			isLinked: () => _isCurrentUserLinked( state ),
			isUnlinking: () => _isUnlinkingUser( state )
		};
	},
	( dispatch ) => {
		return {
			disconnectSite: () => {
				return dispatch( disconnectSite() );
			},
			unlinkUser: () => {
				return dispatch( unlinkUser() );
			}
		};
	}
)( ConnectButton );
