/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Gridicon from 'components/gridicon';
import DashItem from 'components/dash-item';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus, isCurrentUserLinked, isDevMode } from 'state/connection';
import {
	userCanDisconnectSite,
	userIsMaster,
	getUserWpComLogin,
	getUserWpComEmail,
	getUserWpComAvatar,
	getUserGravatar,
	getUsername,
	getSiteIcon,
} from 'state/initial-state';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton from 'components/connect-button';
import MobileMagicLink from 'components/mobile-magic-link';

export class DashConnections extends Component {
	/*
	 * Render a card for site connection. If it's connected, indicate if user is the connection owner.
	 * Show alternative message if site is in development mode.
	 *
	 * @returns {string}
	 */
	siteConnection() {
		let cardContent = '';

		if ( this.props.isDevMode ) {
			cardContent = (
				<div className="jp-connection-settings__info">
					{ this.props.siteIcon ? (
						<img
							width="64"
							height="64"
							className="jp-connection-settings__site-icon"
							src={ this.props.siteIcon }
							alt=""
						/>
					) : (
						<Gridicon icon="globe" size={ 64 } />
					) }
					<div className="jp-connection-settings__text">
						{ __(
							'Your site is in Development Mode, so it can not be connected to WordPress.com.'
						) }
					</div>
				</div>
			);
		} else if ( true === this.props.siteConnectionStatus ) {
			cardContent = (
				<div>
					<div className="jp-connection-settings__info">
						{ this.props.siteIcon ? (
							<img
								width="64"
								height="64"
								className="jp-connection-settings__site-icon"
								src={ this.props.siteIcon }
								alt=""
							/>
						) : (
							<Gridicon icon="globe" size={ 64 } />
						) }
						<div className="jp-connection-settings__text">
							{ __( 'Your site is connected to WordPress.com.' ) }
							{ this.props.userIsMaster && (
								<span className="jp-connection-settings__is-owner">
									<br />
									<em>{ __( 'You are the Jetpack owner.' ) }</em>
								</span>
							) }
						</div>
					</div>
					{ this.props.userCanDisconnectSite && (
						<div className="jp-connection-settings__actions">
							<ConnectButton asLink />
						</div>
					) }
				</div>
			);
		}

		return cardContent;
	}

	/*
	 * Render a card for user linking. If it's connected, show the currently linked user.
	 * Show an alternative message if site is in Dev Mode.
	 *
	 * @returns {string}
	 */
	userConnection() {
		const maybeShowLinkUnlinkBtn = this.props.userIsMaster ? null : (
			<ConnectButton asLink connectUser={ true } from="connection-settings" />
		);

		let cardContent = '';

		if ( this.props.isDevMode ) {
			// return nothing if this is an account connection card
			cardContent = (
				<div className="jp-connection-settings__info">
					{ this.props.userGravatar ? (
						<img
							alt="gravatar"
							width="64"
							height="64"
							className="jp-connection-settings__gravatar"
							src={ this.props.userGravatar }
						/>
					) : (
						<Gridicon icon="user" size={ 64 } />
					) }
					<div className="jp-connection-settings__text">
						{ __( 'The site is in Development Mode, so you can not connect to WordPress.com.' ) }
					</div>
				</div>
			);
		} else {
			cardContent = this.props.isLinked ? (
				<div>
					<div className="jp-connection-settings__info">
						<img
							alt="gravatar"
							width="64"
							height="64"
							className="jp-connection-settings__gravatar"
							src={ this.props.userWpComAvatar }
						/>
						<div className="jp-connection-settings__text">
							{ __( 'Connected as {{span}}%(username)s{{/span}}', {
								args: {
									username: this.props.userWpComLogin,
								},
								components: {
									span: <span className="jp-connection-settings__username" />,
								},
								comment: '%(username) is the WordPress user login name.',
							} ) }
							<div className="jp-connection-settings__email">{ this.props.userWpComEmail }</div>
						</div>
					</div>
					<div className="jp-connection-settings__actions">{ maybeShowLinkUnlinkBtn }</div>
					<MobileMagicLink />
				</div>
			) : (
				<div>
					<div className="jp-connection-settings__info">
						{ __( 'Link your account to WordPress.com to get the most out of Jetpack.' ) }
					</div>
					<div className="jp-connection-settings__actions">{ maybeShowLinkUnlinkBtn }</div>
				</div>
			);
		}

		return cardContent;
	}

	render() {
		return (
			<div>
				<QueryUserConnectionData />
				<div className="jp-at-a-glance__item-grid">
					<div className="jp-at-a-glance__left">
						<div className="jp-dash-item__interior">
							<DashItem
								className="jp-connection-type"
								label={ __( 'Site connection', { context: 'Dashboard widget header' } ) }
							>
								{ this.siteConnection() }
							</DashItem>
						</div>
					</div>
					<div className="jp-at-a-glance__right">
						<div className="jp-dash-item__interior">
							<DashItem
								className="jp-connection-type"
								label={ __( 'Account connection', { context: 'Dashboard widget header' } ) }
							>
								{ this.userConnection() }
							</DashItem>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

DashConnections.propTypes = {
	siteConnectionStatus: PropTypes.any.isRequired,
	isDevMode: PropTypes.bool.isRequired,
	userCanDisconnectSite: PropTypes.bool.isRequired,
	userIsMaster: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	userWpComLogin: PropTypes.any.isRequired,
	userWpComEmail: PropTypes.any.isRequired,
	userWpComAvatar: PropTypes.any.isRequired,
	userGravatar: PropTypes.any.isRequired,
	username: PropTypes.any.isRequired,
};

export default connect( state => {
	return {
		siteConnectionStatus: getSiteConnectionStatus( state ),
		isDevMode: isDevMode( state ),
		userCanDisconnectSite: userCanDisconnectSite( state ),
		userIsMaster: userIsMaster( state ),
		userWpComLogin: getUserWpComLogin( state ),
		userWpComEmail: getUserWpComEmail( state ),
		userWpComAvatar: getUserWpComAvatar( state ),
		userGravatar: getUserGravatar( state ),
		username: getUsername( state ),
		isLinked: isCurrentUserLinked( state ),
		siteIcon: getSiteIcon( state ),
	};
} )( DashConnections );
