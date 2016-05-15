/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import Spinner from 'components/spinner';

/**
 * Internal dependencies
 */
import {
	unlinkUser,
	isCurrentUserLinked as _isCurrentUserLinked,
	isUnlinkingUser as _isUnlinkingUser
} from 'state/connection';
import QueryUserConnectionData from 'components/data/query-user-connection';
import ConnectButton  from 'components/connect-button';

const ConnectionSettings = React.createClass( {
	renderContent: function() {
		const userData = window.Initial_State.userData;

		const maybeShowDisconnectBtn = userData.currentUser.canDisconnect
			? <ConnectButton />
			: null;

		const maybeShowUnlinkBtn = ! userData.currentUser.isMaster
			? <ConnectButton />
			: null;

		// If current user is not linked.
		if ( ! this.props.isLinked( this.props ) ) {
			return(
				<div>
					You, { userData.currentUser.username }, are not linked to WordPress.com <br/>
					<Button
						href={ this.props.connectUrl( this.props ) }
					    disabled={ fetchingUrl }
					>Link to WordPress.com</Button>
					{ maybeShowDisconnectBtn }
				</div>
			);
		}

		return(
			<div>
				You are linked to WordPress.com account <strong>{ userData.currentUser.wpcomUser.login } / { userData.currentUser.wpcomUser.email }</strong><br/>
				{ maybeShowDisconnectBtn }
				{ maybeShowUnlinkBtn }{ this.props.isUnlinking() ? <Spinner /> : null }
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
			isLinked: () => _isCurrentUserLinked( state ),
			isUnlinking: () => _isUnlinkingUser( state )
		}
	},
	( dispatch ) => {
		return {
			unlinkUser: () => {
				return dispatch( unlinkUser() );
			}
		}
	}
)( ConnectionSettings );

