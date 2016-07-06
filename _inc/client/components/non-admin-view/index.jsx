/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ConnectButton from 'components/connect-button';
import { isCurrentUserLinked as _isCurrentUserLinked } from 'state/connection';
import QueryUserConnectionData from 'components/data/query-user-connection';
import NonAdminViewConnected from './connected';
import NonAdminViewNotConnected from './not-connected';

const NonAdminView = React.createClass( {
	displayName: 'JetpackConnect',

	renderContent: function() {
		if ( this.props.isLinked( this.props ) ) {
			return (
				<div>
					<NonAdminViewConnected { ...this.props } />
				</div>
			);
		}

		return (
			<div>
				<NonAdminViewNotConnected />
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
