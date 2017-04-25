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
import SearchableSettings from 'settings/index.jsx';
import { getSiteConnectionStatus } from 'state/connection';

const NonAdminView = React.createClass( {
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
				pageComponent = <AtAGlance { ...this.props } />;
				break;
			case '/settings':
			case '/writing':
			case '/sharing':
				if ( ! this.props.isSubscriber ) {
					navComponent = <NavigationSettings { ...this.props } />;
					pageComponent = <SearchableSettings
						route={ this.props.route }
						siteAdminUrl={ this.props.siteAdminUrl }
						siteRawUrl={ this.props.siteRawUrl }
						searchTerm={ this.props.searchTerm } />;
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
};

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
