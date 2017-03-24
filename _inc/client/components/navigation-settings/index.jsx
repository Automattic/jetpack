/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import { translate as __ } from 'i18n-calypso';
import noop from 'lodash/noop';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();
import UrlSearch from 'mixins/url-search';
import analytics from 'lib/analytics';

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
import { isModuleActivated } from 'state/modules';

export const NavigationSettings = React.createClass( {
	mixins: [ UrlSearch ],

	componentWillMount() {
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

		this.props.searchForTerm( keyword );
	},

	maybeShowSearch() {
		if ( this.props.userCanManageModules ) {
			return (
				<Search
					onClick={ () => this.trackNavClick( 'search' ) }
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

	render: function() {
		let navItems, sharingTab;

		if ( this.props.userCanManageModules ) {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#writing"
						onClick={ () => this.trackNavClick( 'writing' ) }
						selected={ this.props.route.path === '/writing' || this.props.route.path === '/settings' }>
						{ __( 'Writing', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#sharing"
						selected={ this.props.route.path === '/sharing' }>
						{ __( 'Sharing', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#discussion"
						onClick={ () => this.trackNavClick( 'discussion' ) }
						selected={ this.props.route.path === '/discussion' }>
						{ __( 'Discussion', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#traffic"
						onClick={ () => this.trackNavClick( 'traffic' ) }
						selected={ this.props.route.path === '/traffic' }>
						{ __( 'Traffic', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#security"
						onClick={ () => this.trackNavClick( 'security' ) }
						selected={ this.props.route.path === '/security' }>
						{ __( 'Security', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		} else if ( this.props.isSubscriber ) {
			navItems = false;
		} else {
			if ( ! this.props.isModuleActivated( 'publicize' ) || ! this.props.userCanPublish ) {
				sharingTab = '';
			} else {
				sharingTab = (
					<NavItem
						path="#sharing"
						selected={ this.props.route.path === '/sharing' }>
						{ __( 'Sharing', { context: 'Navigation item.' } ) }
					</NavItem>
				);
			}
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#writing"
						selected={ this.props.route.path === '/writing' || this.props.route.path === '/settings' }>
						{ __( 'Writing', { context: 'Navigation item.' } ) }
					</NavItem>
					{
						// Give only Publicize to non admin users
						sharingTab
					}
				</NavTabs>
			);
		}

		return (
			<div className="dops-navigation">
				<SectionNav selectedText={ this.props.route.name }>
					{ navItems }
					{ this.maybeShowSearch() }
				</SectionNav>
			</div>
		);
	}
} );

NavigationSettings.contextTypes = {
	router: React.PropTypes.object.isRequired
};

NavigationSettings.propTypes = {
	userCanManageModules: React.PropTypes.bool.isRequired,
	isSubscriber: React.PropTypes.bool.isRequired,
	userCanPublish: React.PropTypes.bool.isRequired,
	isLinked: React.PropTypes.bool.isRequired,
	isSiteConnected: React.PropTypes.bool.isRequired,
	isModuleActivated: React.PropTypes.func.isRequired,
	searchHasFocus: React.PropTypes.bool.isRequired
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
			searchTerm: getSearchTerm( state )
		};
	},
	( dispatch ) => {
		return {
			searchForTerm: ( term ) => dispatch( filterSearch( term ) )
		};
	}
)( NavigationSettings );
