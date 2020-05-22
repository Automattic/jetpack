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
import noop from 'lodash/noop';
import UrlSearch from 'mixins/url-search';
import analytics from 'lib/analytics';
import intersection from 'lodash/intersection';

/**
 * Internal dependencies
 */
import {
	filterSearch,
	getSearchTerm
} from 'state/search';
import {
	userCanManageModules as _userCanManageModules,
	userIsSubscriber as _userIsSubscriber,
	userCanPublish
} from 'state/initial-state';
import { isSiteConnected, isCurrentUserLinked } from 'state/connection';
import { isModuleActivated, getModules } from 'state/modules';
import { isPluginActive } from 'state/site/plugins';
import QuerySitePlugins from 'components/data/query-site-plugins';

export const NavigationSettings = createReactClass( {
	displayName: 'NavigationSettings',
	mixins: [ UrlSearch ],
	moduleList: [],

	componentWillMount() {
		this.context.router.listen( this.onRouteChange );
		this.moduleList = Object.keys( this.props.moduleList );
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
			path: target
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

    /**
	 * Check that the module list includes at least one of these modules.
	 *
	 * @param  {array}   modules Modules that are probably included in the module list.
	 *
	 * @return {boolean}         True if at least one of the modules is included in the list.
	 */
	hasAnyOfThese( modules = [] ) {
		return 0 < intersection( this.moduleList, modules ).length;
	},

	handleClickForTracking( target ) {
		return () => this.trackNavClick( target );
	},

	render: function() {
		let navItems, sharingTab;
		if ( this.props.userCanManageModules ) {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					{
						this.hasAnyOfThese( [
							'masterbar',
							'markdown',
							'after-the-deadline',
							'custom-content-types',
							'photon',
							'carousel',
							'post-by-email',
							'infinite-scroll',
							'minileven'
						] ) && (
							<NavItem
								path="#writing"
								onClick={ this.handleClickForTracking( 'writing' ) }
								selected={ this.props.route.path === '/writing' || this.props.route.path === '/settings' }>
								{ __( 'Writing', { context: 'Navigation item.' } ) }
							</NavItem>
						)
					}
					{
						this.hasAnyOfThese( [
							'publicize',
							'sharedaddy',
							'likes'
						] ) && (
							<NavItem
								path="#sharing"
								onClick={ this.handleClickForTracking( 'sharing' ) }
								selected={ this.props.route.path === '/sharing' }>
								{ __( 'Sharing', { context: 'Navigation item.' } ) }
							</NavItem>
						)
					}
					{
						this.hasAnyOfThese( [
							'comments',
							'gravatar-hovercards',
							'markdown',
							'subscriptions'
						] ) && (
							<NavItem
								path="#discussion"
								onClick={ this.handleClickForTracking( 'discussion' ) }
								selected={ this.props.route.path === '/discussion' }>
								{ __( 'Discussion', { context: 'Navigation item.' } ) }
							</NavItem>
						)
					}
					{
						this.hasAnyOfThese( [
							'seo-tools',
							'wordads',
							'stats',
							'related-posts',
							'verification-tools',
							'sitemaps',
							'google-analytics'
						] ) && (
							<NavItem
								path="#traffic"
								onClick={ this.handleClickForTracking( 'traffic' ) }
								selected={ this.props.route.path === '/traffic' }>
								{ __( 'Traffic', { context: 'Navigation item.' } ) }
							</NavItem>
						)
					}
					{
						( this.hasAnyOfThese( [
							'protect',
							'sso',
							'vaultpress'
						] ) || this.props.isPluginActive( 'akismet/akismet.php' ) ) && (
							<NavItem
								path="#security"
								onClick={ this.handleClickForTracking( 'security' ) }
								selected={ this.props.route.path === '/security' }>
								{ __( 'Security', { context: 'Navigation item.' } ) }
							</NavItem>
						)
					}
				</NavTabs>
			);
		} else if ( this.props.isSubscriber ) {
			navItems = false;
		} else {
			if ( ! this.props.isModuleActivated( 'publicize' ) || ! this.props.userCanPublish ) {
				sharingTab = '';
			} else {
				sharingTab = this.hasAnyOfThese( [
					'publicize'
				] ) && (
					<NavItem
						path="#sharing"
						onClick={ this.handleClickForTracking( 'sharing' ) }
						selected={ this.props.route.path === '/sharing' }>
						{ __( 'Sharing', { context: 'Navigation item.' } ) }
					</NavItem>
				);
			}
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					{
						this.hasAnyOfThese( [
							'after-the-deadline',
							'post-by-email'
						] ) && (
							<NavItem
								path="#writing"
								onClick={ this.handleClickForTracking( 'writing' ) }
								selected={ this.props.route.path === '/writing' || this.props.route.path === '/settings' }>
								{ __( 'Writing', { context: 'Navigation item.' } ) }
							</NavItem>
						)
					}
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
	}
} );

NavigationSettings.contextTypes = {
	router: PropTypes.object.isRequired
};

NavigationSettings.propTypes = {
	userCanManageModules: PropTypes.bool.isRequired,
	isSubscriber: PropTypes.bool.isRequired,
	userCanPublish: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	isSiteConnected: PropTypes.bool.isRequired,
	isModuleActivated: PropTypes.func.isRequired,
	searchHasFocus: PropTypes.bool.isRequired
};

NavigationSettings.defaultProps = {
	userCanManageModules: false,
	isSubscriber: false,
	userCanPublish: false,
	isLinked: false,
	isSiteConnected: false,
	isModuleActivated: noop,
	searchHasFocus: false
};

export default connect(
	( state ) => {
		return {
			userCanManageModules: _userCanManageModules( state ),
			isSubscriber: _userIsSubscriber( state ),
			userCanPublish: userCanPublish( state ),
			isLinked: isCurrentUserLinked( state ),
			isSiteConnected: isSiteConnected( state ),
			isModuleActivated: module => isModuleActivated( state, module ),
			moduleList: getModules( state ),
			isPluginActive: plugin_slug => isPluginActive( state, plugin_slug ),
			searchTerm: getSearchTerm( state )
		};
	},
	( dispatch ) => {
		return {
			searchForTerm: ( term ) => dispatch( filterSearch( term ) )
		};
	}
)( NavigationSettings );
