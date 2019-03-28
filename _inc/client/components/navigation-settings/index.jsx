/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import { connect } from 'react-redux';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import { translate as __ } from 'i18n-calypso';
import { noop } from 'lodash';
import UrlSearch from 'mixins/url-search';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { filterSearch, getSearchTerm } from 'state/search';
import {
	userCanManageModules as _userCanManageModules,
	userIsSubscriber as _userIsSubscriber,
	userCanPublish,
} from 'state/initial-state';
import { isSiteConnected, isCurrentUserLinked } from 'state/connection';
import {
	getModules,
	hasAnyOfTheseModules,
	hasAnyPerformanceFeature,
	hasAnySecurityFeature,
	isModuleActivated,
} from 'state/modules';
import { isPluginActive } from 'state/site/plugins';
import QuerySitePlugins from 'components/data/query-site-plugins';

export const NavigationSettings = createReactClass( {
	displayName: 'NavigationSettings',
	mixins: [ UrlSearch ],

	UNSAFE_componentWillMount() {
		// We need to handle the search term not only on route update but also on page load in case of some external redirects
		this.onRouteChange( this.context.router.getCurrentLocation() );
		this.context.router.listen( this.onRouteChange );
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
					placeholder={ __( 'Search for a Jetpack feature.' ) }
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
	 * @param {string} href the current location string
	 * @param {string} keyword the new search keyword
	 * @return {string} href the new location string
	 */
	buildUrl: function( href, keyword ) {
		const splitUrl = href.split( '#' ),
			splitHash = splitUrl[ 1 ].split( '?' );

		this.props.searchForTerm( keyword );
		return '#' + splitHash[ 0 ] + ( keyword ? '?term=' + keyword : '' );
	},

	handleClickForTracking( target ) {
		return () => this.trackNavClick( target );
	},

	render: function() {
		let navItems, sharingTab;
		if ( this.props.userCanManageModules ) {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					{ this.props.hasAnySecurityFeature && (
						<NavItem
							path="#security"
							onClick={ this.handleClickForTracking( 'security' ) }
							selected={
								this.props.route.path === '/security' || this.props.route.path === '/settings'
							}
						>
							{ __( 'Security', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
					{ this.props.hasAnyPerformanceFeature && (
						<NavItem
							path="#performance"
							onClick={ this.handleClickForTracking( 'performance' ) }
							selected={ this.props.route.path === '/performance' }
						>
							{ __( 'Performance', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
					{ this.props.hasAnyOfTheseModules( [
						'masterbar',
						'markdown',
						'after-the-deadline',
						'custom-content-types',
						'post-by-email',
						'infinite-scroll',
						'minileven',
						'copy-post',
					] ) && (
						<NavItem
							path="#writing"
							onClick={ this.handleClickForTracking( 'writing' ) }
							selected={ this.props.route.path === '/writing' }
						>
							{ __( 'Writing', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
					{ this.props.hasAnyOfTheseModules( [ 'publicize', 'sharedaddy', 'likes' ] ) && (
						<NavItem
							path="#sharing"
							onClick={ this.handleClickForTracking( 'sharing' ) }
							selected={ this.props.route.path === '/sharing' }
						>
							{ __( 'Sharing', { context: 'Navigation item.' } ) }
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
							selected={ this.props.route.path === '/discussion' }
						>
							{ __( 'Discussion', { context: 'Navigation item.' } ) }
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
							selected={ this.props.route.path === '/traffic' }
						>
							{ __( 'Traffic', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
				</NavTabs>
			);
		} else if ( this.props.isSubscriber ) {
			navItems = false;
		} else {
			if ( ! this.props.isModuleActivated( 'publicize' ) || ! this.props.userCanPublish ) {
				sharingTab = '';
			} else {
				sharingTab = this.props.hasAnyOfTheseModules( [ 'publicize' ] ) && (
					<NavItem
						path="#sharing"
						onClick={ this.handleClickForTracking( 'sharing' ) }
						selected={ this.props.route.path === '/sharing' }
					>
						{ __( 'Sharing', { context: 'Navigation item.' } ) }
					</NavItem>
				);
			}
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					{ this.props.hasAnyOfTheseModules( [ 'after-the-deadline', 'post-by-email' ] ) && (
						<NavItem
							path="#writing"
							onClick={ this.handleClickForTracking( 'writing' ) }
							selected={
								this.props.route.path === '/writing' || this.props.route.path === '/settings'
							}
						>
							{ __( 'Writing', { context: 'Navigation item.' } ) }
						</NavItem>
					) }
					{
						// Give only Publicize to non admin users
						sharingTab
					}
				</NavTabs>
			);
		}

		return (
			<div id="jp-navigation" className="dops-navigation">
				<QuerySitePlugins />
				<SectionNav selectedText={ this.props.route.name }>
					{ navItems }
					{ this.maybeShowSearch() }
				</SectionNav>
			</div>
		);
	},
} );

NavigationSettings.contextTypes = {
	router: PropTypes.object.isRequired,
};

NavigationSettings.propTypes = {
	userCanManageModules: PropTypes.bool.isRequired,
	isSubscriber: PropTypes.bool.isRequired,
	userCanPublish: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	isSiteConnected: PropTypes.bool.isRequired,
	isModuleActivated: PropTypes.func.isRequired,
	searchHasFocus: PropTypes.bool.isRequired,
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
)( NavigationSettings );
