/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { createInterpolateElement } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { hasConnectedOwner, isCurrentUserLinked, isOfflineMode } from 'state/connection';
import { isModuleActivated as _isModuleActivated } from 'state/modules';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import SectionNav from 'components/section-nav';
import {
	getSiteAdminUrl,
	getSiteRawUrl,
	showRecommendations,
	showMyJetpack,
	getNewRecommendationsCount,
	userCanManageModules as _userCanManageModules,
	userCanViewStats as _userCanViewStats,
	getPurchaseToken,
} from 'state/initial-state';

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

	trackRecommendationsClick = () => {
		this.trackNavClick( 'recommendations' );
	};

	trackMyJetpackClick = () => {
		this.trackNavClick( 'my-jetpack' );
	};

	render() {
		let navTabs;

		const jetpackPlansPath = getRedirectUrl(
			this.props.hasConnectedOwner ? 'jetpack-plans' : 'jetpack-nav-site-only-plans',
			{
				site: this.props.siteUrl,
				...( this.props.purchaseToken
					? { query: `purchasetoken=${ this.props.purchaseToken }` }
					: {} ),
			}
		);

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
						{ _x( 'At a Glance', 'Navigation item.', 'jetpack' ) }
					</NavItem>
					{ ! this.props.isOfflineMode && this.props.isLinked && (
						<NavItem
							path="#/my-plan"
							onClick={ this.trackMyPlanClick }
							selected={ this.props.location.pathname === '/my-plan' }
						>
							{ _x( 'My Plan', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
					{ ! this.props.isOfflineMode && (
						<NavItem
							path={ jetpackPlansPath }
							onClick={ this.trackPlansClick }
							selected={ this.props.location.pathname === '/plans' }
						>
							{ _x( 'Plans', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
					{ this.props.showRecommendations && (
						<NavItem
							path="#/recommendations"
							onClick={ this.trackRecommendationsClick }
							selected={ this.props.location.pathname.startsWith( '/recommendations' ) }
						>
							{ createInterpolateElement(
								sprintf(
									/* translators: %d is a count of how many new (unread) recommendations are available. */
									_x( 'Recommendations <count>%d</count>', 'Navigation item.', 'jetpack' ),
									this.props.newRecommendationsCount
								),
								{
									count: (
										<span
											className={
												'dops-section-nav-tab__update-badge count-' +
												this.props.newRecommendationsCount
											}
										></span>
									),
								}
							) }
						</NavItem>
					) }
					{ this.props.showMyJetpack && (
						<NavItem
							path={ this.props.adminUrl + 'admin.php?page=my-jetpack' }
							onClick={ this.trackMyJetpackClick }
						>
							{ _x( 'My Jetpack', 'Navigation item.', 'jetpack' ) }
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
						{ _x( 'At a Glance', 'Navigation item.', 'jetpack' ) }
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
	isOfflineMode: PropTypes.bool,
};

export default connect( state => {
	return {
		userCanManageModules: _userCanManageModules( state ),
		userCanViewStats: _userCanViewStats( state ),
		isModuleActivated: module_name => _isModuleActivated( state, module_name ),
		isOfflineMode: isOfflineMode( state ),
		isLinked: isCurrentUserLinked( state ),
		hasConnectedOwner: hasConnectedOwner( state ),
		showRecommendations: showRecommendations( state ),
		newRecommendationsCount: getNewRecommendationsCount( state ),
		siteUrl: getSiteRawUrl( state ),
		adminUrl: getSiteAdminUrl( state ),
		purchaseToken: getPurchaseToken( state ),
		showMyJetpack: showMyJetpack( state ),
	};
} )( withRouter( Navigation ) );
