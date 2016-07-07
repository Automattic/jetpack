/**
 * External dependencies
 */
import React from 'react';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import { translate as __ } from 'i18n-calypso';
import forEach from 'lodash/forEach';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const NavigationSettings = React.createClass( {
	getInitialState: function() {
		return {
			navTabsSelectedIndex: 0
		};
	},

	getDefaultProps: function () {
		return {
			navTabs: [
				{
					name: __( 'General', { context: 'Navigation item.' } ),
					route: '/general',
					path: '#general'
				},
				{
					name: __( 'Engagement', { context: 'Navigation item.' } ),
					route: '/engagement',
					path: '#engagement'
				},
				{
					name: __( 'Security', { context: 'Navigation item.' } ),
					route: '/security',
					path: '#security'
				},
				{
					name: __( 'Appearance', { context: 'Navigation item.' } ),
					route: '/appearance',
					path: '#appearance'
				},
				{
					name: __( 'Writing', { context: 'Navigation item.' } ),
					route: '/writing',
					path: '#writing'
				}
			]
		}
	},

	demoSearch: function( keywords ) {
		console.log( 'Section Nav Search (keywords):', keywords );
	},

	getSelectedText: function() {
		var selected = this.state[ 'navTabsSelectedIndex' ],
			text = this.props[ 'navTabs' ][ selected ];

		return 'object' === typeof text ? text.name : text;
	},

	handleNavItemClick: function( index ) {
		return function() {
			var stateUpdate = {};

			stateUpdate[ 'navTabsSelectedIndex' ] = index;
			this.setState( stateUpdate );
		};
	},

	isSelected: function( route ) {
		return this.props.route.path === route;
	},

	render: function() {
		console.log( this.getSelectedText() );

		let tabs = [];

		forEach( this.props.navTabs, function( tab, index ) {
			tabs.push( (
				<NavItem
					path={ tab.path }
					selected={ this.isSelected( tab.route ) }
					onClick={ this.handleNavItemClick( index ).bind( this ) }
				>
					{ tab.name }
				</NavItem>
			) );
		}.bind( this ) );

		return (
			<div className='dops-navigation'>
				<SectionNav selectedText={ this.getSelectedText() } >
					<NavTabs selectedText={ this.getSelectedText() } >
						{ tabs }
					</NavTabs>

					<Search
						pinned={ true }
						placeholder="Search doesn't work yet, but you can still write stuff to the console. "
						analyticsGroup="Pages"
						delaySearch={ true }
						onSearch={ this.demoSearch }
					/>
				</SectionNav>
			</div>
		)
	}
} );

export default NavigationSettings;
