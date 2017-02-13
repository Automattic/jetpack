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

export const ConnectButton = React.createClass( {
	displayName: 'ConnectButton',

	propTypes: {
		connectUser: React.PropTypes.bool,
		from: React.PropTypes.string
	},

	getDefaultProps() {
		return {
			connectUser: false,
			from: ''
		};
	},

	renderUserButton: function() {

		// Already linked
		if ( this.props.isLinked ) {
			return (
				<div>
					<Button
						onClick={ this.props.unlinkUser }
						disabled={ this.props.isUnlinking } >
						{ __( 'Unlink me from WordPress.com' ) }
					</Button>
				</div>
			);
		}

		let connectUrl = this.props.connectUrl;
		if ( this.props.from ) {
			connectUrl += `&from=${ this.props.from }`;
			connectUrl += '&additional-user';
		}

		return (
			<Button
				className="is-primary jp-jetpack-connect__button"
				href={ connectUrl }
				disabled={ this.props.fetchingConnectUrl } >
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
		if ( this.props.connectUser ) {
			return this.renderUserButton();
		}

		if ( this.props.isSiteConnected ) {
			return (
				<Button
					onClick={ this.disconnectSite }
					disabled={ this.props.isDisconnecting }>
					{ __( 'Disconnect Jetpack' ) }
				</Button>
			);
		}

		let connectUrl = this.props.connectUrl;
		if ( this.props.from ) {
			connectUrl += `&from=${ this.props.from }`;
		}

		return (
			<Button
				className="is-primary jp-jetpack-connect__button"
				href={ connectUrl }
				disabled={ this.props.fetchingConnectUrl }>
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
			isSiteConnected: _getSiteConnectionStatus( state ),
			isDisconnecting: _isDisconnectingSite( state ),
			fetchingConnectUrl: _isFetchingConnectUrl( state ),
			connectUrl: _getConnectUrl( state ),
			isLinked: _isCurrentUserLinked( state ),
			isUnlinking: _isUnlinkingUser( state )
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
