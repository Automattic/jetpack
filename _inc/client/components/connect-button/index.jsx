/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

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
import { getSiteRawUrl } from 'state/initial-state';
import QueryConnectUrl from 'components/data/query-connect-url';
import onKeyDownCallback from 'utils/onkeydown-callback';
import JetpackDisconnectDialog from 'components/jetpack-disconnect-dialog';

export const ConnectButton = React.createClass( {
	displayName: 'ConnectButton',

	propTypes: {
		connectUser: React.PropTypes.bool,
		from: React.PropTypes.string,
		asLink: React.PropTypes.bool
	},

	getDefaultProps() {
		return {
			connectUser: false,
			from: '',
			asLink: false
		};
	},

	getInitialState() {
		return {
			showModal: false
		};
	},

	handleOpenModal( e ) {
		analytics.tracks.recordJetpackClick( 'manage_site_connection' );
		e.preventDefault();
		this.toggleVisibility();
	},

	disconnectSite() {
		this.toggleVisibility();
		this.props.disconnectSite();
	},

	toggleVisibility() {
		this.setState( { showModal: ! this.state.showModal } );
	},

	renderUserButton: function() {
		// Already linked
		if ( this.props.isLinked ) {
			return (
				<div>
					<a
						role="button"
						tabIndex="0"
						onKeyDown={ onKeyDownCallback( this.props.unlinkUser ) }
						onClick={ this.props.unlinkUser }
						disabled={ this.props.isUnlinking } >
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
				disabled: this.props.fetchingConnectUrl
			},
			connectLegend = __( 'Link to WordPress.com' );

		return this.props.asLink
			? <a { ...buttonProps }>{ connectLegend }</a>
			: <Button { ...buttonProps }>{ connectLegend }</Button>;
	},

	renderContent: function() {
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
					disabled={ this.props.isDisconnecting }>
					{ __( 'Manage site connection' ) }
				</a>
			);
		}

		let connectUrl = this.props.connectUrl;
		if ( this.props.from ) {
			connectUrl += `&from=${ this.props.from }`;
		}

		const buttonProps = {
				className: 'is-primary jp-jetpack-connect__button',
				href: connectUrl,
				disabled: this.props.fetchingConnectUrl
			},
			connectLegend = __( 'Connect Jetpack' );

		return this.props.asLink
			? <a { ...buttonProps }>{ connectLegend }</a>
			: <Button { ...buttonProps }>{ connectLegend }</Button>;
	},

	render() {
		return (
			<div>
				<QueryConnectUrl />
				{ this.renderContent() }
				<JetpackDisconnectDialog
					show={ this.state.showModal }
					toggleModal={ this.toggleVisibility }
					disconnectSite={ this.disconnectSite }
				/>
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			siteRawUrl: getSiteRawUrl( state ),
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
