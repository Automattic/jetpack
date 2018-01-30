/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { isModuleActivated as _isModuleActivated } from 'state/modules';
import { userCanManageModules as _userCanManageModules } from 'state/initial-state';
import { userCanViewStats as _userCanViewStats } from 'state/initial-state';

export class Navigation extends React.Component {
	trackNavClick = target => {
		analytics.tracks.recordJetpackClick( {
			target: 'nav_item',
			path: target
		} );
	};

	render() {
		let navTabs;
		if ( this.props.userCanManageModules ) {
			navTabs = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#/dashboard"
						onClick={ () => this.trackNavClick( 'dashboard' ) }
						selected={ ( this.props.route.path === '/dashboard' ) || ( this.props.route.path === '/' ) }>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#/plans"
						onClick={ () => this.trackNavClick( 'plans' ) }
						selected={ this.props.route.path === '/plans' }>
						{ __( 'Plans', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		} else {
			navTabs = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#/dashboard"
						selected={ ( this.props.route.path === '/dashboard' ) || ( this.props.route.path === '/' ) }>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		}
		return (
			<div className="dops-navigation">
				<SectionNav selectedText={ this.props.route.name }>
					{ navTabs }
				</SectionNav>
			</div>
		);
	}
}

Navigation.propTypes = {
	route: PropTypes.object.isRequired
};

export default connect(
	( state ) => {
		return {
			userCanManageModules: _userCanManageModules( state ),
			userCanViewStats: _userCanViewStats( state ),
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name )
		};
	}
)( Navigation );
