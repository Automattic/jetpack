/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import getRedirectUrl from 'lib/jp-redirect';
import UAParser from 'ua-parser-js';

/**
 * Internal dependencies
 */
import {
	getSiteConnectionStatus as _getSiteConnectionStatus,
	disconnectSite,
	fetchUserConnectionData,
	isDisconnectingSite as _isDisconnectingSite,
	isFetchingConnectUrl as _isFetchingConnectUrl,
	getConnectUrl as _getConnectUrl,
	unlinkUser,
	isCurrentUserLinked as _isCurrentUserLinked,
	isUnlinkingUser as _isUnlinkingUser,
} from 'state/connection';
import { getSiteRawUrl } from 'state/initial-state';
import onKeyDownCallback from 'utils/onkeydown-callback';
import JetpackDisconnectModal from 'components/jetpack-termination-dialog/disconnect-modal';

import './style.scss';

export class ConnectButton extends React.Component {
	static displayName = 'ConnectButton';

	static propTypes = {
		connectUser: PropTypes.bool,
		from: PropTypes.string,
		asLink: PropTypes.bool,
		connectInPlace: PropTypes.bool,
	};

	static defaultProps = {
		connectUser: false,
		from: '',
		asLink: false,
		connectInPlace: true,
	};

	state = {
		showModal: false,
		isAuthorizing: false,
	};

	handleOpenModal = e => {
		analytics.tracks.recordJetpackClick( 'manage_site_connection' );
		e.preventDefault();
		this.toggleVisibility();
	};

	disconnectSite = () => {
		this.toggleVisibility();
		this.props.disconnectSite();
	};

	toggleVisibility = () => {
		this.setState( { showModal: ! this.state.showModal } );
	};

	loadIframe = e => {
		e.preventDefault();
		// If the iframe is already loaded or we don't have a connectUrl yet, return.
		if ( this.state.isAuthorizing || this.props.fetchingConnectUrl ) {
			return;
		}
		// This will disable the connect-button and prevent the iframe from reloading.
		this.setState( { isAuthorizing: true } );
		// Add an event listener to identify successful authorization via iframe.
		window.addEventListener( 'message', this.receiveData );
		this.refs.iframe.height = '220';
		// TODO: Properly fetch 'connectUrl' for iframe authorization.
		this.refs.iframe.src = this.props.connectUrl.replace( 'authorize', 'authorize_iframe' );
	};

	receiveData = e => {
		if ( e.source === this.refs.iframe.contentWindow && e.data === 'close' ) {
			// Remove listener, our job here is done.
			window.removeEventListener( 'message', this.receiveData );
			// Fetch user connection data after successful authorization to trigger state refresh
			// for linked user.
			this.props.fetchUserConnectionData();
		}
	};

	renderUserButton = () => {
		// Already linked
		if ( this.props.isLinked ) {
			return (
				<div>
					<a
						role="button"
						tabIndex="0"
						className="jp-jetpack-unlink__button"
						onKeyDown={ onKeyDownCallback( this.props.unlinkUser ) }
						onClick={ this.props.unlinkUser }
						disabled={ this.props.isUnlinking }
					>
						{ __( 'Unlink me from WordPress.com' ) }
					</a>
				</div>
			);
		}

		let connectUrl = this.props.connectUrl;
		if ( this.props.from ) {
			connectUrl += `&from=${ this.props.from }`;
			connectUrl += '&additional-user';
		}

		const buttonProps = {
				className: 'is-primary jp-jetpack-connect__button',
				href: connectUrl,
				disabled: this.props.fetchingConnectUrl || this.state.isAuthorizing,
			},
			connectLegend = __( 'Link to WordPress.com' );

		// Due to the limitation in how 3rd party cookies are handled in Safari,
		// we're falling back to the original flow on Safari desktop and mobile,
		// thus ignore the 'connectInPlace' property value.
		const UA = UAParser();
		const isSafari = -1 !== UA.browser.name.indexOf( 'Safari' ); // can be 'Safari' or 'Safari Mobile'
		if ( ! this.props.connectInPlace || isSafari ) {
			return this.props.asLink ? (
				<a { ...buttonProps }>{ connectLegend }</a>
			) : (
				<Button { ...buttonProps }>{ connectLegend }</Button>
			);
		}

		// Secondary users in-place connection flow
		buttonProps.onClick = this.loadIframe;

		return (
			<div>
				{ this.props.asLink ? (
					<a { ...buttonProps }>{ connectLegend }</a>
				) : (
					<Button { ...buttonProps }>{ connectLegend }</Button>
				) }
				<div className="connect-iframe-wrap">
					<iframe title="Link to WordPress" ref="iframe" height="0" width="100%"></iframe>
				</div>
			</div>
		);
	};

	renderContent = () => {
		if ( this.props.connectUser ) {
			return this.renderUserButton();
		}

		if ( this.props.isSiteConnected ) {
			return (
				<a
					role="button"
					tabIndex="0"
					onKeyDown={ onKeyDownCallback( this.handleOpenModal ) }
					onClick={ this.handleOpenModal }
					disabled={ this.props.isDisconnecting }
				>
					{ __( 'Manage site connection' ) }
				</a>
			);
		}

		let connectUrl = this.props.connectUrl;
		if ( this.props.from ) {
			connectUrl += `&from=${ this.props.from }`;
		}

		const buttonProps = {
				className: 'jp-jetpack-connect__button',
				href: connectUrl,
				disabled: this.props.fetchingConnectUrl,
			},
			connectLegend = __( 'Set up Jetpack' );

		return this.props.asLink ? (
			<a { ...buttonProps }>{ connectLegend }</a>
		) : (
			<Button { ...buttonProps }>{ connectLegend }</Button>
		);
	};

	render() {
		return (
			<div>
				{ ! this.props.isSiteConnected && (
					<p className="jp-banner__tos-blurb">
						{ __(
							'By clicking the button below, you agree to our {{tosLink}}Terms of Service{{/tosLink}} and to {{shareDetailsLink}}share details{{/shareDetailsLink}} with WordPress.com.',
							{
								components: {
									tosLink: (
										<a
											href={ getRedirectUrl( 'wpcom-tos' ) }
											rel="noopener noreferrer"
											target="_blank"
										/>
									),
									shareDetailsLink: (
										<a
											href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
											rel="noopener noreferrer"
											target="_blank"
										/>
									),
								},
							}
						) }
					</p>
				) }
				{ this.renderContent() }
				{ this.props.children }
				<JetpackDisconnectModal
					show={ this.state.showModal }
					showSurvey={ false }
					toggleModal={ this.toggleVisibility }
				/>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			siteRawUrl: getSiteRawUrl( state ),
			isSiteConnected: _getSiteConnectionStatus( state ),
			isDisconnecting: _isDisconnectingSite( state ),
			fetchingConnectUrl: _isFetchingConnectUrl( state ),
			connectUrl: _getConnectUrl( state ),
			isLinked: _isCurrentUserLinked( state ),
			isUnlinking: _isUnlinkingUser( state ),
		};
	},
	dispatch => {
		return {
			disconnectSite: () => {
				return dispatch( disconnectSite() );
			},
			unlinkUser: () => {
				return dispatch( unlinkUser() );
			},
			fetchUserConnectionData: () => {
				return dispatch( fetchUserConnectionData() );
			},
		};
	}
)( ConnectButton );
