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
import { setInitialState } from 'state/initial-state';

import Navigation from 'components/navigation';
import AtAGlance from 'at-a-glance/index.jsx';
import Engagement from 'engagement/index.jsx';
import GeneralSettings from 'general-settings/index.jsx';

const NonAdminViewConnected = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	shouldComponentUpdate: function( nextProps ) {
		return nextProps.jetpack.connection.status !== this.props.jetpack.connection.status || nextProps.route.path !== this.props.route.path;
	},

	renderMainContent: function( route ) {
		let pageComponent;
		switch ( route ) {
			case '/dashboard':
				pageComponent = <AtAGlance { ...this.props } />;
				break;
			case '/engagement':
				pageComponent = <Engagement { ...this.props } />;
				break;
			case '/general':
				pageComponent = <GeneralSettings { ...this.props } />;
				break;

			default:
				pageComponent = <AtAGlance { ...this.props } />;
		}

		return (
			<div>
				<Navigation { ...this.props } />
				{ pageComponent }
			</div>
		);
	},

	render: function() {
		return (
			this.renderMainContent( this.props.route.path )
		);
	}

} );

export default NonAdminViewConnected;