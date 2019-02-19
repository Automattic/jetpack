/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import DashItem from 'components/dash-item';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus, isCurrentUserLinked, isDevMode } from 'state/connection';
import {
	userIsMaster,
	getUserWpComLogin,
	getUserWpComEmail,
	getUserWpComAvatar,
	getUsername,
} from 'state/initial-state';
import { checkIsMobileUser, sendMobileLoginEmail } from 'state/mobile/actions';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton from 'components/connect-button';

export class DashMobileLogin extends Component {
	/*
	 * Render a card for user linking. If it's connected, show the currently linked user.
	 * Show an alternative message if site is in Dev Mode.
	 *
	 * @returns {string}
	 */
	mobileAppLogin() {
		let cardContent = '';

		if ( this.props.isDevMode ) {
			// return nothing if this is an account connection card
			cardContent = (
				<div className="jp-connection-settings__info">
					<img
						alt="gravatar"
						width="64"
						height="64"
						className="jp-connection-settings__gravatar"
						src={ this.props.userWpComAvatar }
					/>
					<div className="jp-connection-settings__text">
						{ __(
							'The site is in Development Mode, so you can not auto-login to our mobile apps.'
						) }
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
							<a href="#send-login-email" onClick={ this.clickSendLoginEmail }>
								Send me an email that logs me in
							</a>
						</div>
					</div>
				</div>
			) : (
				<div>
					<div className="jp-connection-settings__info">
						{ __( 'Link your account to WordPress.com to get easy access to our mobile apps.' ) }
					</div>
					<div className="jp-connection-settings__actions">
						<ConnectButton asLink connectUser={ true } from="connection-settings" />
					</div>
				</div>
			);
		}

		return cardContent;
	}

	clickSendLoginEmail = e => {
		e.preventDefault();
		this.props.sendMobileLoginEmail();
	};

	render() {
		return (
			<div>
				<QueryUserConnectionData />
				<div className="jp-at-a-glance__item-grid">
					<div className="jp-at-a-glance__left">
						<div className="jp-dash-item__interior">
							<DashItem
								className="jp-connection-type"
								label={ __( 'Mobile app', { context: 'Dashboard widget header' } ) }
							>
								{ this.mobileAppLogin() }
							</DashItem>
						</div>
					</div>
					<div className="jp-at-a-glance__right">
						<div className="jp-dash-item__interior">Nothing to see here</div>
					</div>
				</div>
			</div>
		);
	}
}

DashMobileLogin.propTypes = {
	siteConnectionStatus: PropTypes.any.isRequired,
	isDevMode: PropTypes.bool.isRequired,
	userIsMaster: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	userWpComLogin: PropTypes.any.isRequired,
	userWpComEmail: PropTypes.any.isRequired,
	userWpComAvatar: PropTypes.any.isRequired,
	username: PropTypes.any.isRequired,
};

export default connect(
	state => {
		return {
			siteConnectionStatus: getSiteConnectionStatus( state ),
			isDevMode: isDevMode( state ),
			userIsMaster: userIsMaster( state ),
			userWpComLogin: getUserWpComLogin( state ),
			userWpComEmail: getUserWpComEmail( state ),
			userWpComAvatar: getUserWpComAvatar( state ),
			username: getUsername( state ),
			isLinked: isCurrentUserLinked( state ),
		};
	},
	{
		checkIsMobileUser,
		sendMobileLoginEmail,
	}
)( DashMobileLogin );
