/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { isCurrentUserLinked, isDevMode } from 'state/connection';
import {
	userCanDisconnectSite as _userCanDisconnectSite,
	userIsMaster as _userIsMaster,
	getUserWpComLogin as _getUserWpComLogin,
	getUserWpComEmail as _getUserWpComEmail,
	getUserWpComAvatar as _getUserWpComAvatar,
	getUsername as _getUsername
} from 'state/initial-state';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton from 'components/connect-button';

const ConnectionSettings = React.createClass( {
	renderContent: function() {
		const maybeShowDisconnectBtn = this.props.userCanDisconnectSite
			? <ConnectButton />
			: null;

		const maybeShowLinkUnlinkBtn = this.props.userIsMaster
			? null
			: <ConnectButton connectUser={ true } from="connection-settings" />;

		return this.props.isDevMode ?
			(
				<div>
					{
						__( 'The site is in Development Mode, so you can not connect to WordPress.com.' )
					}
				</div>
			)	:
			<div>
				{
					this.props.isLinked
					? (
						<div className="jp-connection-settings">
							<img alt="gravatar" width="75" height="75" className="jp-connection-settings__gravatar" src={ this.props.userWpComAvatar } />
							<div className="jp-connection-settings__headline">{ __( 'You are connected as ' ) }<span className="jp-connection-settings__username">{ this.props.userWpComLogin }</span></div>
							<div className="jp-connection-settings__email">{ this.props.userWpComEmail }</div>
							<div className="jp-connection-settings__actions">
								{ maybeShowDisconnectBtn }
								{ maybeShowLinkUnlinkBtn }
							</div>
						</div>
					)
					: (
						<div className="jp-connection-settings">
							<div className="jp-connection-settings__headline">{ __( 'Link your account to WordPress.com to get the most out of Jetpack.' ) }</div>
							<div className="jp-connection-settings__actions">
								{ maybeShowDisconnectBtn }
								{ maybeShowLinkUnlinkBtn }
							</div>
						</div>
					)
				}
			</div>
			;
	},

	render() {
		return(
			<div>
				{ this.renderContent() }
				<QueryUserConnectionData />
			</div>
		)
	}
} );

ConnectionSettings.propTypes = {
	isDevMode: React.PropTypes.bool.isRequired,
	userCanDisconnectSite: React.PropTypes.bool.isRequired,
	userIsMaster: React.PropTypes.bool.isRequired,
	isLinked: React.PropTypes.bool.isRequired,
	userWpComLogin: React.PropTypes.any.isRequired,
	userWpComEmail: React.PropTypes.any.isRequired,
	userWpComAvatar: React.PropTypes.any.isRequired,
	username: React.PropTypes.any.isRequired
};

export default connect(
	( state ) => {
		return {
			isDevMode: isDevMode( state ),
			userCanDisconnectSite: _userCanDisconnectSite( state ),
			userIsMaster: _userIsMaster( state ),
			userWpComLogin: _getUserWpComLogin( state ),
			userWpComEmail: _getUserWpComEmail( state ),
			userWpComAvatar: _getUserWpComAvatar( state ),
			username: _getUsername( state ),
			isLinked: isCurrentUserLinked( state )
		}
	}
)( ConnectionSettings );
