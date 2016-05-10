/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import { disconnectSite } from 'state/connection';
import { getConnectUrl } from 'state/initial-state';

const ConnectionSettings = React.createClass( {
	renderContent: function() {
		const userData = window.Initial_State.userData;
		console.log( userData );

		// If current user is not linked.
		if ( ! userData.currentUser.isConnected ) {
			return(
				<div>
					You are user: { userData.currentUser.username } <br/>
					You are not connected to WordPress.com <br/>
					<Button href={ getConnectUrl( this.props ) }>Link to WordPress.com</Button>
				</div>
			);
		}


		return(
			<div>
				You are user: { userData.currentUser.username } <br/>
				You are connected as WordPress.com user: <strong>{ userData.currentUser.wpcomUser.login }</strong><br/>
				<Button onClick={ this.props.disconnectSite } >Disconnect Site</Button>
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
	dispatch => bindActionCreators( { disconnectSite }, dispatch )
)( ConnectionSettings );

