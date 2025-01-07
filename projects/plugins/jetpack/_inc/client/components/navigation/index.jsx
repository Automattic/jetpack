import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { _x, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import SectionNav from 'components/section-nav';
import NavItem from 'components/section-nav/item';
import NavTabs from 'components/section-nav/tabs';
import analytics from 'lib/analytics';
import { hasConnectedOwner, isCurrentUserLinked, isOfflineMode } from 'state/connection';
import {
	getSiteRawUrl,
	showRecommendations,
	userCanManageModules as _userCanManageModules,
	userCanViewStats as _userCanViewStats,
	getPurchaseToken,
	getSiteAdminUrl,
} from 'state/initial-state';
import { isModuleActivated as _isModuleActivated } from 'state/modules';
import { getNonViewedRecommendationsCount } from 'state/recommendations';

export class Navigation extends React.Component {
	trackNavClick = target => {
		analytics.tracks.recordJetpackClick( {
			target: 'nav_item',
			path: target,
		} );
	};

	trackNewRecommendations = () => {
		// Only track this event if the new recommendations bubble is visible and the user is not on the 'Recommendations' tab already
		if (
			this.props.newRecommendationsCount > 0 &&
			! this.props.location.pathname.startsWith( '/recommendations' )
		) {
			analytics.tracks.recordEvent( 'jetpack_recommendations_new_recommendation_bubble_visible', {
				path: this.props.location.pathname,
			} );
		}
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
		const isBubbleVisible = this.props.newRecommendationsCount > 0;

		// Track when the recommendations tab is clicked and note whether or not the "new recommendations" bubble is visible.
		analytics.tracks.recordJetpackClick( {
			target: 'nav_item',
			path: 'recommendations',
			is_new_recommendations_bubble_visible: isBubbleVisible,
		} );
	};

	componentDidMount() {
		this.trackNewRecommendations();
	}

	render() {
		let navTabs;
		const redirectUri = `redirect_to=${ this.props.adminUrl }admin.php?page=jetpack`;
		const purchaseToken = this.props.purchaseToken
			? `&purchasetoken=${ this.props.purchaseToken }`
			: '';
		// If the user is not connected, this query will trigger a connection after checkout flow.
		const connectQuery = this.props.isLinked
			? ''
			: `&connect_after_checkout=true&from_site_slug=${ this.props.siteUrl }&admin_url=${ this.props.adminUrl }`;
		const query = `${ redirectUri }${ purchaseToken }${ connectQuery }`;

		let jetpackPlansPath = getRedirectUrl(
			this.props.hasConnectedOwner ? 'jetpack-plans' : 'jetpack-nav-plans-no-site',
			{ query }
		);

		// If the user is not connected, we want to remove the site query parameter from the URL.
		// The pricing page sends the user to a list of sites rather than checkout if a site is in context
		// and the user is not connected to the site.
		// This is hacky, but we are deprecating the dashboard soon so it's not worth the effort for a more robust fix.
		if ( ! this.props.isLinked ) {
			jetpackPlansPath = jetpackPlansPath.replace( /&site=\d+/, '' );
		}

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
							isExternalLink={ true }
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
											className={ clsx( 'dops-section-nav-tab__update-badge', {
												'is-hidden':
													this.props.location.pathname.startsWith( '/recommendations' ) ||
													! this.props.newRecommendationsCount,
											} ) }
										></span>
									),
								}
							) }
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
		newRecommendationsCount: getNonViewedRecommendationsCount( state ),
		siteUrl: getSiteRawUrl( state ),
		adminUrl: getSiteAdminUrl( state ),
		purchaseToken: getPurchaseToken( state ),
	};
} )( withRouter( Navigation ) );
