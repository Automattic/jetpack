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
import { isModuleActivated as _isModuleActivated } from 'state/modules';
import Navigation from 'components/navigation';
import NavigationSettings from 'components/navigation-settings';
import AtAGlance from 'at-a-glance/index.jsx';
import Engagement from 'engagement/index.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import Writing from 'writing/index.jsx';

const NonAdminViewConnected = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	shouldComponentUpdate: function( nextProps ) {
		return nextProps.jetpack.connection.status !== this.props.jetpack.connection.status || nextProps.route.path !== this.props.route.path;
	},

	renderMainContent: function( route ) {
		let pageComponent,
			navComponent = <Navigation { ...this.props } />;
		switch ( route ) {
			case '/dashboard':
				if ( window.Initial_State.userData.currentUser.permissions.view_stats || this.props.isModuleActivated( 'protect' ) ) {
					pageComponent = <AtAGlance { ...this.props } />;
				}
				break;
			case '/apps':
				pageComponent = 'this will be the APPS page';
				break;
			case '/settings':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <GeneralSettings { ...this.props } />;
				break;
			case '/general':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <GeneralSettings { ...this.props } />;
				break;
			case '/engagement':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <Engagement { ...this.props } />;
				break;
			case '/writing':
				navComponent = <NavigationSettings { ...this.props } />;
				pageComponent = <Writing { ...this.props } />;
				break;

			default:
				pageComponent = <AtAGlance { ...this.props } />;
		}

		window.wpNavMenuClassChange();

		return (
			<div>
				{ navComponent }
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

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name )
		};
	}
)( NonAdminViewConnected );