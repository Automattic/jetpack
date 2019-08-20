/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
// import superagent from 'superagent';
// import { loadScript } from '@automattic/load-script';

/**
 * Internal dependencies
 */
import {
	getSiteConnectionStatus,
	isFetchingConnectionStatus,
	isFetchingAuthorizeUrl,
	getAuthorizeUrl,
	isSiteRegistered,
	isSiteRegistering,
	disconnectSite,
	isDisconnectingSite,
	unlinkUser,
	isCurrentUserLinked,
	isUnlinkingUser,
	registerSite,
	fetchAuthorizeUrl,
	finishedRemoteAuthorize,
} from 'state/connection';
import { getSiteRawUrl } from 'state/initial-state';
import onKeyDownCallback from 'utils/onkeydown-callback';
import JetpackDisconnectDialog from 'components/jetpack-disconnect-dialog';
import QueryConnectionStatus from 'components/data/query-connection-status';

import './style.scss';

class AuthorizeIframe extends React.Component {
	shouldComponentUpdate() {
		return false;
	}

	componentDidMount() {
		window.addEventListener( 'message', this.receiveData );
	}

	componentWillUnmount() {
		window.removeEventListener( 'message', this.receiveData );
	}

	receiveData = e => {
		if ( e.origin === 'https://jetpack.wordpress.com' && e.source === this.iframe.contentWindow ) {
			console.log( 'got message', e );
			if ( e.data === 'close' ) {
				console.log( 'closing iframe' );
				this.props.finishedRemoteAuthorize();
			}
		}
	};

	render() {
		return (
			<Fragment>
				<iframe
					className="jp-jetpack-connect__iframe"
					src={ this.props.url }
					ref={ el => ( this.iframe = el ) }
				/>
			</Fragment>
		);
	}
}

export class ConnectButton extends React.Component {
	static displayName = 'ConnectButton';

	static propTypes = {
		connectUser: PropTypes.bool,
		from: PropTypes.string,
		asLink: PropTypes.bool,
	};

	static defaultProps = {
		connectUser: false,
		from: '',
		asLink: false,
	};

	state = {
		showModal: false,
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

	renderUserButton = () => {
		// Already linked
		if ( this.props.isLinked ) {
			return (
				<Fragment>
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
				</Fragment>
			);
		}

		// TODO this isn't actually fetched any more
		let connectUrl = this.props.connectUrl;
		if ( this.props.from ) {
			connectUrl += `&from=${ this.props.from }`;
			connectUrl += '&additional-user';
		}

		const buttonProps = {
				className: 'is-primary',
				href: connectUrl,
				disabled: this.props.fetchingConnectionStatus,
			},
			connectLegend = __( 'Link to WordPress.com' );

		return this.props.asLink ? (
			<a { ...buttonProps }>{ connectLegend }</a>
		) : (
			<Button { ...buttonProps }>{ connectLegend }</Button>
		);
	};

	handleConnectButtonClick = event => {
		event.stopPropagation();
		if ( ! this.props.isRegistered ) {
			// registers the site
			this.props.registerSite();
		} else {
			// fetches the authorize URL which is used for the authorize iframe
			this.props.fetchAuthorizeUrl();
		}
	};

	renderContent = () => {
		if ( this.props.connectUser ) {
			return this.renderUserButton();
		}

		// TODO - figure out what to do with this
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

		let label = __( 'Set up Jetpack' );

		const buttonProps = {
			className: 'is-primary',
			onClick: this.handleConnectButtonClick,
			disabled:
				this.props.fetchingConnectionStatus ||
				this.props.isRegistering ||
				this.props.fetchingAuthorizeUrl,
		};

		// render authorize iframe if site is registered but not authorized
		if ( this.props.isRegistered && ! this.props.isSiteConnected && this.props.authorizeUrl ) {
			return (
				<Fragment>
					<QueryConnectionStatus />
					<AuthorizeIframe
						url={ this.props.authorizeUrl }
						finishedRemoteAuthorize={ this.props.finishedRemoteAuthorize }
					/>
				</Fragment>
			);
		} else {
			return (
				<Fragment>
					<QueryConnectionStatus />
					{ this.props.asLink ? (
						<a { ...buttonProps }>{ label }</a>
					) : (
						<Button { ...buttonProps }>{ label }</Button>
					) }
				</Fragment>
			);
		}
	};

	render() {
		return (
			<Fragment>
				{ ! this.props.isSiteConnected && (
					<p className="jp-jetpack-connect__tos-blurb">
						{ __(
							'By clicking the button below, you agree to our {{tosLink}}Terms of Service{{/tosLink}} and to {{shareDetailsLink}}share details{{/shareDetailsLink}} with WordPress.com.',
							{
								components: {
									tosLink: (
										<a href="https://wordpress.com/tos" rel="noopener noreferrer" target="_blank" />
									),
									shareDetailsLink: (
										<a
											href="https://jetpack.com/support/what-data-does-jetpack-sync"
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
				<JetpackDisconnectDialog
					show={ this.state.showModal }
					toggleModal={ this.toggleVisibility }
					disconnectSite={ this.disconnectSite }
				/>
			</Fragment>
		);
	}
}

export default connect(
	state => {
		return {
			siteRawUrl: getSiteRawUrl( state ),
			isSiteConnected: getSiteConnectionStatus( state ),
			fetchingConnectionStatus: isFetchingConnectionStatus( state ),
			isRegistering: isSiteRegistering( state ),
			isDisconnecting: isDisconnectingSite( state ),
			isRegistered: isSiteRegistered( state ),
			isLinked: isCurrentUserLinked( state ),
			isUnlinking: isUnlinkingUser( state ),
			fetchingAuthorizeUrl: isFetchingAuthorizeUrl( state ),
			authorizeUrl: getAuthorizeUrl( state ),
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
			registerSite: () => {
				return dispatch( registerSite() );
			},
			fetchAuthorizeUrl: () => {
				return dispatch( fetchAuthorizeUrl() );
			},
			showAuthorizeIframe: () => {
				return dispatch( showAuthorizeIframe() );
			},
			finishedRemoteAuthorize: () => {
				return dispatch( finishedRemoteAuthorize() );
			},
		};
	}
)( ConnectButton );
