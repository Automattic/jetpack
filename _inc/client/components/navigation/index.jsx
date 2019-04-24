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
import {
	userCanManageModules as _userCanManageModules,
	userCanViewStats as _userCanViewStats,
} from 'state/initial-state';
import { isDevMode } from 'state/connection';

export class Navigation extends React.Component {
	trackNavClick = target => {
		analytics.tracks.recordJetpackClick( {
			target: 'nav_item',
			path: target,
		} );
	};

	trackDashboardClick = () => {
		this.trackNavClick( 'dashboard' );
	};

	trackMyPlanClick = () => {
		this.trackNavClick( 'my-plan' );
	};

	trackPlansClick = () => {
		this.trackNavClick( 'plans' );
	};

	render() {
		let navTabs;
		if ( this.props.userCanManageModules ) {
			navTabs = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#/dashboard"
						onClick={ this.trackDashboardClick }
						selected={ this.props.route.path === '/dashboard' || this.props.route.path === '/' }
					>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
					{ ! this.props.isDevMode && (
						<NavItem
							path="#/my-plan"
							onClick={ this.trackMyPlanClick }
							selected={ this.props.route.path === '/my-plan' }
						>
							{ __( 'My Plan', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
					{ ! this.props.isDevMode && (
						<NavItem
							path="#/plans"
							onClick={ this.trackPlansClick }
							selected={ this.props.route.path === '/plans' }
						>
							{ __( 'Plans', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
				</NavTabs>
			);
		} else {
			navTabs = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#/dashboard"
						selected={ this.props.route.path === '/dashboard' || this.props.route.path === '/' }
					>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		}
		return (
			<div id="jp-navigation" className="dops-navigation">
				<SectionNav selectedText={ this.props.route.name }>{ navTabs }</SectionNav>
			</div>
		);
	}
}

Navigation.propTypes = {
	route: PropTypes.object.isRequired,
	isDevMode: PropTypes.bool.isRequired,
};

export default connect( state => {
	return {
		userCanManageModules: _userCanManageModules( state ),
		userCanViewStats: _userCanViewStats( state ),
		isModuleActivated: module_name => _isModuleActivated( state, module_name ),
		isDevMode: isDevMode( state ),
	};
} )( Navigation );
