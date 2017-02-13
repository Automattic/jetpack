/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	userCanViewStats as _userCanViewStats,
	userIsSubscriber as _userIsSubscriber
} from 'state/initial-state';
import { isModuleActivated as _isModuleActivated } from 'state/modules';
import Navigation from 'components/navigation';
import NavigationSettings from 'components/navigation-settings';
import AtAGlance from 'at-a-glance/index.jsx';
import Engagement from 'engagement/index.jsx';
import GeneralSettings from 'general-settings/index.jsx';
import Writing from 'writing/index.jsx';
import Apps from 'apps/index.jsx';
import { getSiteConnectionStatus } from 'state/connection';

const NonAdminView = React.createClass( {
	componentWillMount: function() {
		this.props.setInitialState();
	},

	shouldComponentUpdate: function( nextProps ) {
		return nextProps.siteConnectionStatus !== this.props.siteConnectionStatus ||
			nextProps.route.path !== this.props.route.path;
	},

	renderMainContent: function( route ) {
		let pageComponent,
			navComponent = <Navigation { ...this.props } />;
		switch ( route ) {
			case '/dashboard':
			default:
				if ( this.props.userCanViewStats || this.props.isModuleActivated( 'protect' ) ) {
					pageComponent = <AtAGlance { ...this.props } />;
				} else {
					// If routing took us to Dashboard but user can't view anything, fallback to Apps
					pageComponent = <Apps { ...this.props } />;
				}
				break;
			case '/apps':
				pageComponent = <Apps { ...this.props } />;
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
				if ( ! this.props.isSubscriber ) {
					navComponent = <NavigationSettings { ...this.props } />;
					pageComponent = <Engagement { ...this.props } />;
				}
				break;
			case '/writing':
				if ( ! this.props.isSubscriber ) {
					navComponent = <NavigationSettings { ...this.props } />;
					pageComponent = <Writing { ...this.props } />;
				}
				break;
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

NonAdminView.propTypes = {
	userCanViewStats: React.PropTypes.bool.isRequired,
	isSubscriber: React.PropTypes.bool.isRequired,
	siteConnectionStatus: React.PropTypes.any.isRequired
}

export default connect(
	( state ) => {
		return {
			userCanViewStats: _userCanViewStats( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
			isSubscriber: _userIsSubscriber( state ),
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name )
		};
	}
)( NonAdminView );
