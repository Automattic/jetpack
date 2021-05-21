/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import { connect } from 'react-redux';
import { noop } from 'lodash';
import { withRouter } from 'react-router-dom';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { filterSearch, getSearchTerm } from 'state/search';
import { isSiteConnected, isCurrentUserLinked } from 'state/connection';
import {
	getModules,
	hasAnyOfTheseModules,
	hasAnyPerformanceFeature,
	hasAnySecurityFeature,
	isModuleActivated,
} from 'state/modules';
import { isPluginActive } from 'state/site/plugins';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import QuerySitePlugins from 'components/data/query-site-plugins';
import Search from 'components/search';
import SectionNav from 'components/section-nav';
import UrlSearch from 'mixins/url-search';
import {
	userCanManageModules as _userCanManageModules,
	userIsSubscriber as _userIsSubscriber,
	userCanPublish,
} from 'state/initial-state';

export const NavigationSettings = createReactClass( {
	displayName: 'NavigationSettings',
	mixins: [ UrlSearch ],

	UNSAFE_componentWillMount() {
		// We need to handle the search term not only on route update but also on page load in case of some external redirects
		this.onRouteChange( this.props.location );
		this.props.history.listen( this.onRouteChange );
	},

	onRouteChange( newRoute ) {
		const search = newRoute.search || '',
			pairs = search.substr( 1 ).split( '&' ),
			term = pairs.filter( item => {
				return 0 === item.indexOf( 'term=' );
			} );

		let keyword = '';

		if ( term.length > 0 ) {
			keyword = term[ 0 ].split( '=' )[ 1 ];
		}

		this.props.searchForTerm( decodeURIComponent( keyword ) );
	},

	maybeShowSearch() {
		if ( this.props.userCanManageModules ) {
			return (
				<Search
					onClick={ this.handleClickForTracking( 'search' ) }
					pinned={ true }
					fitsContainer={ true }
					placeholder={ __( 'Search for a Jetpack feature.', 'jetpack' ) }
					delaySearch={ true }
					delayTimeout={ 500 }
					onSearch={ this.doSearch }
					isOpen={ !! this.props.searchTerm }
					initialValue={ this.props.searchTerm }
				/>
			);
		}
	},

	trackNavClick( target ) {
		analytics.tracks.recordJetpackClick( {
			target: 'nav_item',
			path: target,
		} );
	},

	/**
	 * The UrlSearch mixin callback to form a new location href string.
	 *
	 * @param {string} href - the current location string
	 * @param {string} keyword - the new search keyword
	 * @returns {string} href the new location string
	 */
	buildUrl: function ( href, keyword ) {
		const splitUrl = href.split( '#' ),
			splitHash = splitUrl[ 1 ].split( '?' );

		this.props.searchForTerm( keyword );
		return '#' + splitHash[ 0 ] + ( keyword ? '?term=' + keyword : '' );
	},

	handleClickForTracking( target ) {
		return () => this.trackNavClick( target );
	},

	render: function () {
		let navItems, sharingTab, writingTab;
		if ( this.props.userCanManageModules ) {
			navItems = (
				<NavTabs selectedText={ this.props.routeName }>
					{ this.props.hasAnySecurityFeature && (
						<NavItem
							path="#security"
							onClick={ this.handleClickForTracking( 'security' ) }
							selected={
								this.props.location.pathname === '/security' ||
								this.props.location.pathname === '/settings'
							}
						>
							{ _x( 'Security', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
					{ this.props.hasAnyPerformanceFeature && (
						<NavItem
							path="#performance"
							onClick={ this.handleClickForTracking( 'performance' ) }
							selected={ this.props.location.pathname === '/performance' }
						>
							{ _x( 'Performance', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
					{ this.props.hasAnyOfTheseModules( [
						'masterbar',
						'markdown',
						'custom-content-types',
						'post-by-email',
						'infinite-scroll',
						'copy-post',
					] ) && (
						<NavItem
							path="#writing"
							onClick={ this.handleClickForTracking( 'writing' ) }
							selected={ this.props.location.pathname === '/writing' }
						>
							{ _x( 'Writing', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
					{ this.props.hasAnyOfTheseModules( [ 'publicize', 'sharedaddy', 'likes' ] ) && (
						<NavItem
							path="#sharing"
							onClick={ this.handleClickForTracking( 'sharing' ) }
							selected={ this.props.location.pathname === '/sharing' }
						>
							{ _x( 'Sharing', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
					{ this.props.hasAnyOfTheseModules( [
						'comments',
						'gravatar-hovercards',
						'markdown',
						'subscriptions',
					] ) && (
						<NavItem
							path="#discussion"
							onClick={ this.handleClickForTracking( 'discussion' ) }
							selected={ this.props.location.pathname === '/discussion' }
						>
							{ _x( 'Discussion', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
					{ this.props.hasAnyOfTheseModules( [
						'seo-tools',
						'wordads',
						'stats',
						'related-posts',
						'verification-tools',
						'sitemaps',
						'google-analytics',
					] ) && (
						<NavItem
							path="#traffic"
							onClick={ this.handleClickForTracking( 'traffic' ) }
							selected={ this.props.location.pathname === '/traffic' }
						>
							{ _x( 'Traffic', 'Navigation item.', 'jetpack' ) }
						</NavItem>
					) }
				</NavTabs>
			);
		} else if ( this.props.isSubscriber ) {
			navItems = false;
		} else {
			// Show a sharing tab if the Publicize module is active and the user can publish.
			if ( ! this.props.isModuleActivated( 'publicize' ) || ! this.props.userCanPublish ) {
				sharingTab = '';
			} else {
				sharingTab = this.props.hasAnyOfTheseModules( [ 'publicize' ] ) && (
					<NavItem
						path="#sharing"
						onClick={ this.handleClickForTracking( 'sharing' ) }
						selected={
							this.props.location.pathname === '/sharing' ||
							this.props.location.pathname === '/settings'
						}
					>
						{ _x( 'Sharing', 'Navigation item.', 'jetpack' ) }
					</NavItem>
				);
			}

			// Show a Writing tab if the Post By Email module is active and the user can publish.
			if ( ! this.props.isModuleActivated( 'post-by-email' ) || ! this.props.userCanPublish ) {
				writingTab = '';
			} else {
				writingTab = this.props.hasAnyOfTheseModules( [ 'post-by-email' ] ) && (
					<NavItem
						path="#writing"
						onClick={ this.handleClickForTracking( 'writing' ) }
						selected={ this.props.location.pathname === '/writing' }
					>
						{ _x( 'Writing', 'Navigation item.', 'jetpack' ) }
					</NavItem>
				);
			}
			navItems = (
				<NavTabs selectedText={ this.props.routeName }>
					{ writingTab }
					{ sharingTab }
				</NavTabs>
			);
		}

		return (
			<div id="jp-navigation" className="dops-navigation">
				<QuerySitePlugins />
				<SectionNav selectedText={ this.props.routeName }>
					{ navItems }
					{ this.maybeShowSearch() }
				</SectionNav>
			</div>
		);
	},
} );

NavigationSettings.propTypes = {
	userCanManageModules: PropTypes.bool.isRequired,
	isSubscriber: PropTypes.bool.isRequired,
	userCanPublish: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	isSiteConnected: PropTypes.bool.isRequired,
	isModuleActivated: PropTypes.func.isRequired,
	searchHasFocus: PropTypes.bool.isRequired,
	location: PropTypes.object.isRequired,
};

NavigationSettings.defaultProps = {
	userCanManageModules: false,
	isSubscriber: false,
	userCanPublish: false,
	isLinked: false,
	isSiteConnected: false,
	isModuleActivated: noop,
	searchHasFocus: false,
};

export default connect(
	state => ( {
		hasAnyOfTheseModules: modules => hasAnyOfTheseModules( state, modules ),
		hasAnyPerformanceFeature: hasAnyPerformanceFeature( state ),
		hasAnySecurityFeature: hasAnySecurityFeature( state ),
		userCanManageModules: _userCanManageModules( state ),
		isSubscriber: _userIsSubscriber( state ),
		userCanPublish: userCanPublish( state ),
		isLinked: isCurrentUserLinked( state ),
		isSiteConnected: isSiteConnected( state ),
		isModuleActivated: module => isModuleActivated( state, module ),
		moduleList: getModules( state ),
		isPluginActive: plugin_slug => isPluginActive( state, plugin_slug ),
		searchTerm: getSearchTerm( state ),
	} ),
	dispatch => ( {
		searchForTerm: term => dispatch( filterSearch( term ) ),
	} )
)( withRouter( NavigationSettings ) );
