/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { isCurrentUserLinked as _isCurrentUserLinked } from 'state/connection';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton from 'components/connect-button';

const ConnectionSettings = React.createClass( {
	renderContent: function() {
		const userData = window.Initial_State.userData;
		const isLinked = this.props.isLinked( this.props );

		const maybeShowDisconnectBtn = userData.currentUser.permissions.disconnect
			? <ConnectButton />
			: null;

		const maybeShowLinkUnlinkBtn = userData.currentUser.isMaster
			? null
			: <ConnectButton connectUser={ true } />;

		return(
			<div>
				{
					isLinked
						? `You are linked to WordPress.com account ${ userData.currentUser.wpcomUser.login } / ${ userData.currentUser.wpcomUser.email }`
						: `You, ${ userData.currentUser.username }, are not connected to WordPress.com`
				}
				{ maybeShowDisconnectBtn }
				{ maybeShowLinkUnlinkBtn }
			</div>
		)
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
			isLinked: () => _isCurrentUserLinked( state )
		}
	}
)( ConnectionSettings );
