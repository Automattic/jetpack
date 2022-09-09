import { getRedirectUrl } from '@automattic/jetpack-components';
import { DisconnectDialog } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getFragment } from '@wordpress/url';
import Button from 'components/button';
import QuerySiteBenefits from 'components/data/query-site-benefits';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
	getSiteConnectionStatus as _getSiteConnectionStatus,
	isDisconnectingSite as _isDisconnectingSite,
	isFetchingConnectUrl as _isFetchingConnectUrl,
	getConnectUrl as _getConnectUrl,
	unlinkUser,
	connectUser as _connectUser,
	isCurrentUserLinked as _isCurrentUserLinked,
	isUnlinkingUser as _isUnlinkingUser,
	isConnectingUser as _isConnectingUser,
	fetchSiteConnectionStatus,
	fetchConnectUrl,
} from 'state/connection';
import {
	getSiteRawUrl,
	isSafari,
	doNotUseConnectionIframe,
	getApiNonce,
	getApiRootUrl,
	getInitialStateConnectedPlugins,
	getPluginBaseUrl,
	getUserWpComLogin,
	getUserWpComId,
	getSiteId,
} from 'state/initial-state';
import { getSiteBenefits } from 'state/site';
import onKeyDownCallback from 'utils/onkeydown-callback';
import './style.scss';
import JetpackBenefits from '../jetpack-benefits';

export class ConnectButton extends React.Component {
	static displayName = 'ConnectButton';

	static propTypes = {
		connectUser: PropTypes.bool,
		from: PropTypes.string,
		asLink: PropTypes.bool,
		connectLegend: PropTypes.string,
		connectInPlace: PropTypes.bool,
		customConnect: PropTypes.func,
		autoOpenInDisconnectRoute: PropTypes.bool,
	};

	static defaultProps = {
		connectUser: false,
		from: '',
		asLink: false,
		connectInPlace: true,
		autoOpenInDisconnectRoute: false,
	};

	constructor( props ) {
		super( props );
		this.state = {
			showModal:
				props.autoOpenInDisconnectRoute && '#/disconnect' === getFragment( window.location.href ),
		};
	}

	handleOpenModal = e => {
		analytics.tracks.recordJetpackClick( 'manage_site_connection' );
		e.preventDefault();
		this.toggleVisibility();
	};

	handleDisconnected = () => {
		this.props.fetchConnectUrl();
		this.props.fetchSiteConnectionStatus();
	};

	toggleVisibility = () => {
		this.setState( { showModal: ! this.state.showModal } );
	};

	loadIframe = e => {
		e.preventDefault();
		// If the iframe is already loaded or we don't have a connectUrl yet, return.
		if ( this.props.isAuthorizing || this.props.fetchingConnectUrl ) {
			return;
		}

		// Track click
		analytics.tracks.recordJetpackClick( 'link_account_in_place' );

		if ( this.props.customConnect ) {
			this.props.customConnect();
		} else {
			// Dispatch user in place authorization.
			this.props.doConnectUser();
		}
	};

	renderDisconnectStepComponent = () => {
		return this.props.siteBenefits ? (
			<JetpackBenefits siteBenefits={ this.props.siteBenefits } />
		) : null;
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
						{ this.props.connectLegend || __( 'Disconnect your Jetpack account', 'jetpack' ) }
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
				disabled: this.props.fetchingConnectUrl || this.props.isAuthorizing,
			},
			connectLegend = this.props.connectLegend || __( 'Connect your Jetpack account', 'jetpack' );

		// Secondary users in-place connection flow

		// Due to the limitation in how 3rd party cookies are handled in Safari,
		// we're falling back to the original flow on Safari desktop and mobile,
		// thus ignore the 'connectInPlace' property value.

		// We also check the `doNotUseConnectionIframe` initial global state property.
		// This will override the button's `connectInPlace` property.

		if (
			this.props.connectInPlace &&
			! this.props.isSafari &&
			! this.props.doNotUseConnectionIframe
		) {
			buttonProps.onClick = this.loadIframe;
		}

		return this.props.asLink ? (
			<a { ...buttonProps }>{ connectLegend }</a>
		) : (
			<Button { ...buttonProps }>{ connectLegend }</Button>
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
					{ this.props.connectLegend || __( 'Manage site connection', 'jetpack' ) }
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
			connectLegend = this.props.connectLegend || __( 'Set up Jetpack', 'jetpack' );

		return this.props.asLink ? (
			<a { ...buttonProps }>{ connectLegend }</a>
		) : (
			<Button { ...buttonProps }>{ connectLegend }</Button>
		);
	};

	render() {
		return (
			<div>
				<QuerySiteBenefits />
				{ ! this.props.isSiteConnected && (
					<p className="jp-banner__tos-blurb">
						{ createInterpolateElement(
							__(
								'By clicking the button below, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with Jetpack.com.',
								'jetpack'
							),
							{
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
							}
						) }
					</p>
				) }
				{ this.renderContent() }
				{ this.props.children }
				<DisconnectDialog
					apiNonce={ this.props.apiNonce }
					apiRoot={ this.props.apiRoot }
					connectedPlugins={ this.props.connectedPlugins }
					connectedUser={ {
						ID: this.props.userWpComId,
						login: this.props.userWpComLogin,
					} }
					connectedSiteId={ this.props.connectedSiteId }
					disconnectStepComponent={ this.renderDisconnectStepComponent() }
					onDisconnected={ this.handleDisconnected } // On disconnect, need to update the connection status in the app state.
					isOpen={ this.state.showModal }
					onClose={ this.toggleVisibility }
					context={ 'jetpack' }
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
			isAuthorizing: _isConnectingUser( state ),
			isSafari: isSafari( state ),
			doNotUseConnectionIframe: doNotUseConnectionIframe( state ),
			apiNonce: getApiNonce( state ),
			apiRoot: getApiRootUrl( state ),
			connectedPlugins: getInitialStateConnectedPlugins( state ),
			siteBenefits: getSiteBenefits( state ),
			pluginUrl: getPluginBaseUrl( state ),
			userWpComLogin: getUserWpComLogin( state ),
			userWpComId: getUserWpComId( state ),
			connectedSiteId: getSiteId( state ),
		};
	},
	dispatch => {
		return {
			fetchConnectUrl: () => {
				return dispatch( fetchConnectUrl() );
			},
			fetchSiteConnectionStatus: () => {
				return dispatch( fetchSiteConnectionStatus() );
			},
			unlinkUser: () => {
				return dispatch( unlinkUser() );
			},
			doConnectUser: () => {
				return dispatch( _connectUser() );
			},
		};
	}
)( ConnectButton );
