import { getRedirectUrl } from '@automattic/jetpack-components';
import { DisconnectDialog } from '@automattic/jetpack-connection';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getFragment } from '@wordpress/url';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import QuerySiteBenefits from 'components/data/query-site-benefits';
import JetpackBanner from 'components/jetpack-banner';
import analytics from 'lib/analytics';
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
	isConnectionOwner,
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
import JetpackBenefits from '../jetpack-benefits';
import OwnerDisconnectDialog from '../owner-disconnect-dialog';
import './style.scss';

export class ConnectButton extends React.Component {
	static displayName = 'ConnectButton';

	static propTypes = {
		connectUser: PropTypes.bool,
		from: PropTypes.string,
		asLink: PropTypes.bool,
		asBanner: PropTypes.bool,
		connectLegend: PropTypes.string,
		connectInPlace: PropTypes.bool,
		customConnect: PropTypes.func,
		autoOpenInDisconnectRoute: PropTypes.bool,
		rna: PropTypes.bool,
		compact: PropTypes.bool,
		isConnectionOwner: PropTypes.bool,
	};

	static defaultProps = {
		connectUser: false,
		from: '',
		asLink: false,
		connectInPlace: true,
		autoOpenInDisconnectRoute: false,
		rna: false,
		compact: false,
		isConnectionOwner: false,
	};

	constructor( props ) {
		super( props );
		this.state = {
			showModal:
				props.autoOpenInDisconnectRoute && '#/disconnect' === getFragment( window.location.href ),
			showOwnerDisconnectDialog: false,
		};
	}

	handleOpenModal = e => {
		if ( e ) {
			e.preventDefault();
		}

		analytics.tracks.recordJetpackClick( 'manage_site_connection' );
		this.toggleVisibility();
	};

	handleUserDisconnectClick = () => {
		if ( this.props.isConnectionOwner ) {
			this.setState( { showOwnerDisconnectDialog: true } );
		} else {
			this.props.unlinkUser();
		}
	};

	handleDisconnected = () => {
		// Refresh the page or update UI state after successful disconnect
		window.location.reload();
	};

	toggleVisibility = () => {
		this.setState( { showModal: ! this.state.showModal } );
	};

	loadConnectionScreen = e => {
		if ( e ) {
			e.preventDefault();
		}
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
			this.props.doConnectUser( null, this.props.from );
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
						onKeyDown={ onKeyDownCallback( this.handleUserDisconnectClick ) }
						onClick={ this.handleUserDisconnectClick }
						disabled={ this.props.isUnlinking }
					>
						{ this.props.connectLegend || __( 'Disconnect your WordPress.com account', 'jetpack' ) }
					</a>

					{ this.props.isConnectionOwner && this.state.showOwnerDisconnectDialog && (
						<OwnerDisconnectDialog
							isOpen={ this.state.showOwnerDisconnectDialog }
							onClose={ this.handleOwnerDialogClose }
							apiRoot={ this.props.apiRoot }
							apiNonce={ this.props.apiNonce }
							onDisconnected={ this.handleDisconnected }
							onUnlinked={ this.handleDisconnected }
						/>
					) }
				</div>
			);
		}

		if ( this.props.asBanner ) {
			return (
				<JetpackBanner
					title={ __(
						'Get the most out of Jetpack by connecting your WordPress.com account',
						'jetpack'
					) }
					noIcon
					callToAction={ __( 'Connect', 'jetpack' ) }
					onClick={ this.loadConnectionScreen }
					eventFeature="connect-account"
					path="dashboard"
					eventProps={ { type: 'connect' } }
					isPromotion={ false }
				/>
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
				onClick: this.loadConnectionScreen,
			},
			connectLegend =
				this.props.connectLegend || __( 'Connect your WordPress.com account', 'jetpack' );

		return this.props.asLink ? (
			<a { ...buttonProps }>{ connectLegend }</a>
		) : (
			<Button rna={ this.props.rna } compact={ this.props.compact } { ...buttonProps }>
				{ connectLegend }
			</Button>
		);
	};

	renderContent = () => {
		if ( this.props.connectUser ) {
			return this.renderUserButton();
		}

		if ( this.props.isSiteConnected ) {
			return (
				<JetpackBanner
					title={ __( 'Your site is connected to WordPress.com.', 'jetpack' ) }
					noIcon
					callToAction={ this.props.connectLegend || __( 'Manage', 'jetpack' ) }
					onClick={ this.handleOpenModal }
					eventFeature="manage-site-connection"
					path="dashboard"
					eventProps={ { type: 'manage' } }
					isPromotion={ false }
				/>
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

	handleOwnerDialogClose = () => {
		this.setState( { showOwnerDisconnectDialog: false } );
	};

	render() {
		return (
			<div>
				<QuerySiteBenefits />
				{ ! this.props.isSiteConnected && (
					<p className="jp-banner__tos-blurb">
						{ createInterpolateElement(
							__(
								`By clicking the button below, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>sync your site's data</shareDetailsLink> with us.`,
								'jetpack'
							),
							{
								tosLink: <ExternalLink href={ getRedirectUrl( 'wpcom-tos' ) } />,
								shareDetailsLink: (
									<ExternalLink
										href={ getRedirectUrl( 'jetpack-support-what-data-does-jetpack-sync' ) }
									/>
								),
							}
						) }
					</p>
				) }
				{ this.renderContent() }
				{ ! this.state.showOwnerDisconnectDialog && (
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
						onDisconnected={ this.handleDisconnected }
						isOpen={ this.state.showModal }
						onClose={ this.toggleVisibility }
						context={ 'jetpack' }
					/>
				) }
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
			isConnectionOwner: isConnectionOwner( state ),
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
			doConnectUser: ( featureLabel, from ) => {
				return dispatch( _connectUser( featureLabel, from ) );
			},
		};
	}
)( ConnectButton );
