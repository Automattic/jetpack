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
import trim from 'lodash/trim';
import analytics from 'lib/analytics';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

/**
 * Internal dependencies
 */
import { filterSearch } from 'state/search';
import {
	userCanManageModules as _userCanManageModules,
	userIsSubscriber as _userIsSubscriber
} from 'state/initial-state';

export const NavigationSettings = React.createClass( {
	openSearch: function() {
		let currentHash = window.location.hash;
		if ( currentHash.indexOf( 'search' ) === -1 ) {
			window.location.hash = 'search';
		}
	},

	onSearch( term ) {
		if ( term.length >= 3 ) {
			analytics.tracks.recordEvent( 'jetpack_wpa_search_term', { term: term.toLowerCase() } );
		}
		this.props.searchForTerm( trim( term || '' ).toLowerCase() );
	},

	onClose: function() {
		let currentHash = window.location.hash;
		if ( currentHash.indexOf( 'search' ) > -1 ) {
			this.context.router.goBack();
		}
	},

	maybeShowSearch: function() {
		if ( this.props.userCanManageModules ) {
			return (
				<Search
					pinned={ true }
					placeholder={ __( 'Search for a Jetpack feature.' ) }
					delaySearch={ true }
					delayTimeout={ 500 }
					onSearchOpen={ this.openSearch }
					onSearch={ this.onSearch }
					onSearchClose={ this.onClose }
					isOpen={ '/search' === this.props.route.path }
				/>
			);
		}
	},

	render: function() {
		let navItems;

		if ( this.props.userCanManageModules ) {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#general"
						selected={ ( this.props.route.path === '/general' || this.props.route.path === '/settings' ) }>
						{ __( 'General', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#engagement"
						selected={ this.props.route.path === '/engagement' }>
						{ __( 'Engagement', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#security"
						selected={ this.props.route.path === '/security' }>
						{ __( 'Security', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#appearance"
						selected={ this.props.route.path === '/appearance' }>
						{ __( 'Appearance', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#writing"
						selected={ this.props.route.path === '/writing' }>
						{ __( 'Writing', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		} else if ( this.props.isSubscriber ) {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#general"
						selected={ ( this.props.route.path === '/general' || this.props.route.path === '/settings' ) }>
						{ __( 'General', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		} else {
			navItems = (
				<NavTabs selectedText={ this.props.route.name }>
					<NavItem
						path="#general"
						selected={ ( this.props.route.path === '/general' || this.props.route.path === '/settings' ) }>
						{ __( 'General', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#engagement"
						selected={ this.props.route.path === '/engagement' }>
						{ __( 'Engagement', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#writing"
						selected={ this.props.route.path === '/writing' }>
						{ __( 'Writing', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		}

		return (
			<div className='dops-navigation'>
				<SectionNav selectedText={ this.props.route.name }>
					{ navItems }
					{ this.maybeShowSearch() }
				</SectionNav>
			</div>
		)
	}
} );

NavigationSettings.contextTypes = {
	router: React.PropTypes.object.isRequired
};

export default connect(
	( state ) => {
		return {
			userCanManageModules: _userCanManageModules( state ),
			isSubscriber: _userIsSubscriber( state )
		};
	},
	( dispatch ) => {
		return {
			searchForTerm: ( term ) => dispatch( filterSearch( term ) )
		}
	}
)( NavigationSettings );
