/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import Gridicon from 'components/gridicon';

/**
 * Internal dependencies
 */
import {
	getSiteConnectionStatus,
	isCurrentUserLinked,
	isDevMode
} from 'state/connection';
import {
	userCanDisconnectSite,
	userIsMaster,
	getUserWpComLogin,
	getUserWpComEmail,
	getUserWpComAvatar,
	getUsername,
	getSiteIcon
} from 'state/initial-state';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton from 'components/connect-button';

const ConnectionSettings = React.createClass( {
	render() {

		const maybeShowDisconnectBtn = this.props.userCanDisconnectSite
			? <ConnectButton asLink />
			: null;

		const maybeShowLinkUnlinkBtn = this.props.userIsMaster
			? null
			: <ConnectButton asLink connectUser={ true } from="connection-settings" />;

		let cardContent = '';

		if ( this.props.isDevMode ) {
			if ( 'site' === this.props.type ) {
				cardContent = (
					<div className="jp-connection-settings__info">
						{
							this.props.siteIcon
								? <img width="64" height="64" className="jp-connection-settings__site-icon" src={ this.props.siteIcon } />
								: <Gridicon icon="globe" size={ 64 } />
						}
						<div className="jp-connection-settings__text">
							{
								__( 'Your site is in Development Mode, so it can not be connected to WordPress.com.' )
							}
						</div>
					</div>
				);
			} else {
				// return nothing if this is an account connection card
				cardContent = (
					<div className="jp-connection-settings__info">
						<img alt="gravatar" width="64" height="64" className="jp-connection-settings__gravatar" src={ this.props.userWpComAvatar } />
						<div className="jp-connection-settings__text">
							{
								__( 'The site is in Development Mode, so you can not connect to WordPress.com.' )
							}
						</div>
					</div>
				);
			}
		} else {
			if ( 'site' === this.props.type ) {
				if ( true === this.props.siteConnectionStatus ) {
					cardContent = (
						<div>
							<div className="jp-connection-settings__info">
								{
									this.props.siteIcon
										? <img width="64" height="64" className="jp-connection-settings__site-icon" src={ this.props.siteIcon } />
										: <Gridicon icon="globe" size={ 64 } />
								}
								<div className="jp-connection-settings__text">
									{
										__( 'Your site is connected to WordPress.com.' )
									}
									{
										this.props.userIsMaster
											? <span><br /><em>{ __( 'You are the Jetpack owner.' ) }</em></span>
											: ''
									}
								</div>
							</div>
							{
								this.props.userCanDisconnectSite
									? <div className="jp-connection-settings__actions">
										{ maybeShowDisconnectBtn }
								</div>
									: ''
							}
						</div>
					);
				}
			} else {
				cardContent = (
					this.props.isLinked
						? <div>
							<div className="jp-connection-settings__info">
								<img alt="gravatar" width="64" height="64" className="jp-connection-settings__gravatar" src={ this.props.userWpComAvatar } />
								<div className="jp-connection-settings__text">
									{ __( 'Connected as ' ) }<span className="jp-connection-settings__username">{ this.props.userWpComLogin }</span>
									<div className="jp-connection-settings__email">{ this.props.userWpComEmail }</div>
								</div>
							</div>
							<div className="jp-connection-settings__actions">
								{ maybeShowLinkUnlinkBtn }
							</div>
						</div>
						: <div>
							<div className="jp-connection-settings__info">
								{
									__( 'Link your account to WordPress.com to get the most out of Jetpack.' )
								}
							</div>
							<div className="jp-connection-settings__actions">
								{ maybeShowLinkUnlinkBtn }
							</div>
						</div>
				);
			}
		}

		return(
			<div className="jp-connection-type">
				<QueryUserConnectionData />
				<SectionHeader label={ 'site' === this.props.type ? __( 'Site Connection' ) : __( 'Account Connection' ) } />
				<Card>
					{ cardContent }
				</Card>
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
			siteConnectionStatus: getSiteConnectionStatus( state ),
			isDevMode: isDevMode( state ),
			userCanDisconnectSite: userCanDisconnectSite( state ),
			userIsMaster: userIsMaster( state ),
			userWpComLogin: getUserWpComLogin( state ),
			userWpComEmail: getUserWpComEmail( state ),
			userWpComAvatar: getUserWpComAvatar( state ),
			username: getUsername( state ),
			isLinked: isCurrentUserLinked( state ),
			siteIcon: getSiteIcon( state )
		}
	}
)( ConnectionSettings );
