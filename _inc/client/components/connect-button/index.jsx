/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import SectionHeader from 'components/section-header';
import Modal from 'components/modal';

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
import QueryConnectUrl from 'components/data/query-connect-url';

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
		e.preventDefault();
		this.setState( { showModal: true } );
	},

	handleCloseModal() {
		this.setState( { showModal: false } );
	},

	disconnectSite() {
		this.handleCloseModal();
		this.props.disconnectSite();
	},

	getModal() {
		return this.state.showModal && (
			<Modal title={ __( 'Manage Site Connection' ) } onRequestClose={ this.handleCloseModal } initialFocus="">
				<SectionHeader label={ __( 'Manage Site Connection' ) } />
				<Card className="jp-connection-settings__modal-body">
					{
						__( 'Disconnecting Jetpack means that most features will be disabled, including all security services, content delivery, related posts, promotion and SEO tools, and all features in paid plans.' )
					}
					<div className="jp-connection-settings__modal-actions">
						<Button
							borderless
							className="jp-connection-settings__cancel"
							onClick={ this.handleCloseModal }>
							{
								__( 'Cancel' )
							}
						</Button>
						<Button
							scary
							primary
							className="jp-connection-settings__disconnect"
							onClick={ this.disconnectSite }>
							{
								__( 'Disconnect' )
							}
						</Button>
					</div>
				</Card>
			</Modal>
		);
	},

	renderUserButton: function() {

		// Already linked
		if ( this.props.isLinked ) {
			return (
				<div>
					<a
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

		let buttonProps = {
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

		let buttonProps = {
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
				{ this.getModal() }
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
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
