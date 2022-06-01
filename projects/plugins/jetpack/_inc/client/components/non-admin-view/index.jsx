import AtAGlance from 'at-a-glance/index.jsx';
import Navigation from 'components/navigation';
import NavigationSettings from 'components/navigation-settings';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import SearchableSettings from 'settings/index.jsx';
import { getSiteConnectionStatus } from 'state/connection';
import {
	userCanManageModules,
	userCanViewStats as _userCanViewStats,
	userIsSubscriber as _userIsSubscriber,
} from 'state/initial-state';
import { isModuleActivated as _isModuleActivated } from 'state/modules';

class NonAdminView extends React.Component {
	shouldComponentUpdate( nextProps ) {
		return (
			nextProps.siteConnectionStatus !== this.props.siteConnectionStatus ||
			nextProps.location.pathname !== this.props.location.pathname
		);
	}

	renderMainContent = route => {
		let pageComponent,
			navComponent = <Navigation { ...this.props } />;
		switch ( route ) {
			case '/dashboard':
			default:
				this.props.history.replace( '/dashboard' );
				pageComponent = <AtAGlance { ...this.props } />;
				break;
			case '/settings':
			case '/writing':
			case '/sharing':
			case '/performance':
				if ( ! this.props.isSubscriber ) {
					navComponent = <NavigationSettings { ...this.props } />;
					pageComponent = (
						<SearchableSettings
							siteAdminUrl={ this.props.siteAdminUrl }
							siteRawUrl={ this.props.siteRawUrl }
							searchTerm={ this.props.searchTerm }
							userCanManageModules={ this.props.userCanManageModules }
						/>
					);
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
	};

	render() {
		return this.renderMainContent( this.props.location.pathname );
	}
}

NonAdminView.propTypes = {
	userCanViewStats: PropTypes.bool.isRequired,
	isSubscriber: PropTypes.bool.isRequired,
	siteConnectionStatus: PropTypes.any.isRequired,
};

export default connect( state => {
	return {
		userCanViewStats: _userCanViewStats( state ),
		siteConnectionStatus: getSiteConnectionStatus( state ),
		isSubscriber: _userIsSubscriber( state ),
		isModuleActivated: module_name => _isModuleActivated( state, module_name ),
		userCanManageModules: userCanManageModules( state ),
	};
} )( NonAdminView );
