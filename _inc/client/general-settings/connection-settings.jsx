/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { isCurrentUserLinked, isDevMode } from 'state/connection';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton from 'components/connect-button';

const ConnectionSettings = React.createClass( {
	renderContent: function() {
		const userData = window.Initial_State.userData;

		const maybeShowDisconnectBtn = userData.currentUser.permissions.disconnect
			? <ConnectButton />
			: null;

		const maybeShowLinkUnlinkBtn = userData.currentUser.isMaster
			? null
			: <ConnectButton connectUser={ true } />;

		return isDevMode( this.props ) ?
			<div>
				{
					__( 'The site is in Development Mode, so you can not connect to WordPress.com.' )
				}
			</div>
			:
			<div>
				{
					this.props.isLinked( this.props ) ?
						__( 'You are linked to WordPress.com account {{userLogin}} / {{userEmail}}.', {
							components: {
								userLogin: userData.currentUser.wpcomUser.login,
								userEmail: userData.currentUser.wpcomUser.email
							}
						} )
						:
						__( 'You, {{userName}}, are not connected to WordPress.com.', {
							components: {
								userName: userData.currentUser.username
							}
						} )
				}
				{ maybeShowDisconnectBtn }
				{ maybeShowLinkUnlinkBtn }
			</div>
			;
	},

	render() {
		return(
			<div>
				{ this.renderContent() }
				<QueryUserConnectionData />
			</div>
		)
	}
} );

export default connect(
	( state ) => {
		return {
			isLinked: () => isCurrentUserLinked( state )
		}
	}
)( ConnectionSettings );
