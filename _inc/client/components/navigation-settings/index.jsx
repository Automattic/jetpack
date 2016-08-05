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
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import SearchPage from 'search/index.jsx';

const NavigationSettings = React.createClass( {
	demoSearch: function( keywords ) {
		console.log( 'Section Nav Search (keywords):', keywords );
	},

	openSearch: function() {
		let currentHash = window.location.hash;
		if ( currentHash.indexOf( 'search' ) === -1 ) {
			window.location.hash = 'search';
		}
	},

	onSearch( keywords ) {
		this.setState( { filter: trim( keywords || '' ).toLowerCase() } );
	},

	onClose: function() {
		let currentHash = window.location.hash;
		if ( currentHash.indexOf( 'search' ) > -1 ) {
			history.go( -1 );
		}
	},

	render: function() {
		let navItems;
		if ( window.Initial_State.userData.currentUser.permissions.manage_modules ) {
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

					<Search
						pinned={ true }
						placeholder="Search doesn't work yet, but you can still write stuff to the console."
						onSearchOpen={ this.openSearch }
						onSearch={ this.onSearch }
						onSearchClose={ this.onClose }
					/>
				</SectionNav>
			</div>
		)
	}
} );

export default connect(
	( state ) => {
		return state;
	}
)( NavigationSettings );
