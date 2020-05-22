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
import { withRouter } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { isModuleActivated as _isModuleActivated } from 'state/modules';
import {
	userCanManageModules as _userCanManageModules,
	userCanViewStats as _userCanViewStats,
} from 'state/initial-state';
import { isCurrentUserLinked, isDevMode } from 'state/connection';

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
				<NavTabs selectedText={ this.props.routeName }>
					<NavItem
						path="#/dashboard"
						onClick={ this.trackDashboardClick }
						selected={
							this.props.location.pathname === '/dashboard' || this.props.location.pathname === '/'
						}
					>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
					{ ! this.props.isDevMode && this.props.isLinked && (
						<NavItem
							path="#/my-plan"
							onClick={ this.trackMyPlanClick }
							selected={ this.props.location.pathname === '/my-plan' }
						>
							{ __( 'My Plan', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
					{ ! this.props.isDevMode && this.props.isLinked && (
						<NavItem
							path="#/plans"
							onClick={ this.trackPlansClick }
							selected={ this.props.location.pathname === '/plans' }
						>
							{ __( 'Plans', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
				</NavTabs>
			);
		} else {
			navTabs = (
				<NavTabs selectedText={ this.props.routeName }>
					<NavItem
						path="#/dashboard"
						selected={
							this.props.location.pathname === '/dashboard' || this.props.location.pathname === '/'
						}
					>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		}
		return (
			<div id="jp-navigation" className="dops-navigation">
				<SectionNav selectedText={ this.props.routeName }>{ navTabs }</SectionNav>
			</div>
		);
	}
}

Navigation.propTypes = {
	routeName: PropTypes.string.isRequired,
	isDevMode: PropTypes.bool.isRequired,
};

export default connect( state => {
	return {
		userCanManageModules: _userCanManageModules( state ),
		userCanViewStats: _userCanViewStats( state ),
		isModuleActivated: module_name => _isModuleActivated( state, module_name ),
		isDevMode: isDevMode( state ),
		isLinked: isCurrentUserLinked( state ),
	};
} )( withRouter( Navigation ) );
