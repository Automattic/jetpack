/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import { translate as __ } from 'lib/mixins/i18n';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import { isCurrentUserLinked as _isCurrentUserLinked } from 'state/connection';
import QueryUserConnectionData from 'components/data/query-user-connection';

const NonAdminView = React.createClass( {
	displayName: 'JetpackConnect',

	renderContent: function() {
		const userData = window.Initial_State.userData.currentUser;
		const isLinked = this.props.isLinked( this.props );
		const headerText = userData.permissions.edit_posts
			? __( 'Write posts via email, get notifications about your site activity, and log in with a single click.' )
			: __( 'Get notifications about your site activity and log in with a single click.' );
		let descriptionText = __( 'Sign in to your WordPress.com account to unlock these features.' );
		let belowText = __( 'No WordPress.com account? Create one for free.' );

		if ( isLinked ) {
			descriptionText = __( 'Connected as user %(userLogin)s / %(userEmail)s', {
				args: {
					userLogin: userData.wpcomUser.login,
					userEmail: userData.wpcomUser.email
				}
			} );
			belowText = '';
		}

		return (
			<div className="jp-jetpack-connect__container">
				<h3 className="jp-jetpack-connect__container-title" title={ headerText }>{ headerText }</h3>

				<Card className="jp-jetpack-connect__cta">
					<p className="jp-jetpack-connect__description">{ descriptionText }</p>
					<ConnectButton connectUser={ true } />
					<p><a href="https://wordpress.com/start/jetpack/" className="jp-jetpack-connect__link">{ belowText }</a></p>
				</Card>
			</div>
		);
	},

	render: function() {
		return (
			<div>
				<QueryUserConnectionData />
				{ this.renderContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isLinked: () => _isCurrentUserLinked( state )
		}
	}
)( NonAdminView );
