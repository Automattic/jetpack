/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus, isCurrentUserLinked, isDevMode } from 'state/connection';
import {
	userCanCustomize,
	userCanDisconnectSite,
	userIsMaster,
	getUserWpComLogin,
	getUserWpComEmail,
	getUserWpComAvatar,
	getUsername,
	getSiteIcon,
	getSiteAdminUrl,
} from 'state/initial-state';
import QueryUserConnectionData from 'components/data/query-user-connection';
import Button from 'components/button';
import ConnectButton from 'components/connect-button';
import Gridicon from 'components/gridicon';
import DashItem from 'components/dash-item';

/**
 * Renders the site icon, using the stored icon if there's one. Otherwise uses the default globe icon.
 *
 * @param {string} siteIcon URL to the image used as the site icon.
 * @returns {object} The site icon.
 */
const renderSiteIcon = siteIcon =>
	siteIcon ? (
		<img
			width="64"
			height="64"
			className="jp-connection-settings__site-icon"
			src={ siteIcon }
			alt=""
		/>
	) : (
		<Gridicon icon="globe" size={ 64 } />
	);

/**
 * Render button linked to the Customizer Site Icon section
 *
 * @param {string}  linkToCustomizer Link to the Customizer screen.
 * @returns {object} Button to change the site icon.
 */
const getChangeSiteIcon = linkToCustomizer => (
	<Button compact href={ linkToCustomizer } className="jp-connection-settings__change-site-icon">
		{ __( 'Change' ) }
	</Button>
);

export class DashConnections extends Component {
	static propTypes = {
		siteConnectionStatus: PropTypes.any.isRequired,
		isDevMode: PropTypes.bool.isRequired,
		userCanDisconnectSite: PropTypes.bool.isRequired,
		userIsMaster: PropTypes.bool.isRequired,
		isLinked: PropTypes.bool.isRequired,
		userWpComLogin: PropTypes.any.isRequired,
		userWpComEmail: PropTypes.any.isRequired,
		userWpComAvatar: PropTypes.any.isRequired,
		username: PropTypes.any.isRequired,
		customizeSiteIcon: PropTypes.string.isRequired,
		userCanCustomize: PropTypes.bool.isRequired,
	};

	/**
	 * Render a card for site connection. If it's connected, indicate if user is the connection owner.
	 * Show alternative message if site is in development mode.
	 *
	 * @returns {object} Card for site connection.
	 */
	siteConnection() {
		let cardContent = '';

		if ( this.props.isDevMode ) {
			cardContent = (
				<React.Fragment>
					<div className="jp-connection-settings__info">
						<div className="jp-connection-settings__site-icon-wrap">
							{ renderSiteIcon( this.props.siteIcon ) }
							{ this.props.userCanCustomize && getChangeSiteIcon( this.props.customizeSiteIcon ) }
						</div>
						<div className="jp-connection-settings__text">
							{ __(
								'Your site is in Development Mode, so it can not be connected to WordPress.com.'
							) }
						</div>
					</div>
				</React.Fragment>
			);
		} else if ( true === this.props.siteConnectionStatus ) {
			cardContent = (
				<React.Fragment>
					<div className="jp-connection-settings__info">
						<div className="jp-connection-settings__site-icon-wrap">
							{ renderSiteIcon( this.props.siteIcon ) }
							{ this.props.userCanCustomize && getChangeSiteIcon( this.props.customizeSiteIcon ) }
						</div>
						<div className="jp-connection-settings__text">
							{ __( 'Your site is connected to WordPress.com.' ) }
							{ this.props.userIsMaster && (
								<span className="jp-connection-settings__is-owner">
									<br />
									<em>{ __( 'You are the Jetpack owner.' ) }</em>
								</span>
							) }
							<br />
							{ this.props.userCanDisconnectSite && (
								<div className="jp-connection-settings__actions">
									<ConnectButton asLink />
								</div>
							) }
						</div>
					</div>
				</React.Fragment>
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
					<img
						alt="gravatar"
						width="64"
						height="64"
						className="jp-connection-settings__gravatar"
						src={ this.props.userWpComAvatar }
					/>
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

export default connect( state => {
	return {
		siteConnectionStatus: getSiteConnectionStatus( state ),
		isDevMode: isDevMode( state ),
		userCanCustomize: userCanCustomize( state ),
		userCanDisconnectSite: userCanDisconnectSite( state ),
		userIsMaster: userIsMaster( state ),
		userWpComLogin: getUserWpComLogin( state ),
		userWpComEmail: getUserWpComEmail( state ),
		userWpComAvatar: getUserWpComAvatar( state ),
		username: getUsername( state ),
		isLinked: isCurrentUserLinked( state ),
		siteIcon: getSiteIcon( state ),
		customizeSiteIcon: `${ getSiteAdminUrl(
			state
		) }customize.php?autofocus[section]=title_tagline`,
	};
} )( DashConnections );
