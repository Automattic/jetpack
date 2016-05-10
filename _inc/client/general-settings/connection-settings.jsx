/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import { disconnectSite } from 'state/connection';
import { unlinkUser } from 'state/connection';
import { getConnectUrl } from 'state/initial-state';

const ConnectionSettings = React.createClass( {
	renderContent: function() {
		const userData = window.Initial_State.userData;
		const maybeShowDisconnectBtn = userData.currentUser.canDisconnect
			? <Button onClick={ this.props.disconnectSite } >Disconnect Site</Button>
			: null;

		const maybeShowUnlinkBtn = ! userData.currentUser.isMaster
			? <Button onClick={ this.props.unlinkUser } >Unlink User</Button>
			: null;

		console.log( userData );

		// If current user is not linked.
		if ( ! userData.currentUser.isConnected ) {
			return(
				<div>
					This site is connected to WordPress.com user <strong>{ userData.masterData.wpcomUser.login } / { userData.masterData.wpcomUser.email }</strong>
					<br/>
					You, { userData.currentUser.username }, are not linked to WordPress.com <br/>

					<Button href={ getConnectUrl( this.props ) }>Link to WordPress.com</Button>
					{ maybeShowDisconnectBtn }
				</div>
			);
		}

		return(
			<div>
				This site is connected to WordPress.com user <strong>{ userData.masterData.wpcomUser.login } / { userData.masterData.wpcomUser.email }</strong><br/>
				{ maybeShowDisconnectBtn }
				{ maybeShowUnlinkBtn }
			</div>
		)
	},

	render() {
		return(
			<div>
				{ this.renderContent() }
			</div>
		)
	}
} );

export default connect(
	state => {
		return state;
	},
	( dispatch ) => {
		return {
			disconnectSite: () => {
				return dispatch( disconnectSite() );
			},
			unlinkUser: () => {
				return dispatch( unlinkUser() );
			}
		}
	}
)( ConnectionSettings );

