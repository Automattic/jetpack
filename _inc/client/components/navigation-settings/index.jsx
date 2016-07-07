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
import find from 'lodash/find';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const NavigationSettings = React.createClass( {
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
		var path = this.props.route.path;
		var text = find( this.props[ 'navTabs' ], function( tab ) {
			return tab.route === path;
		} );

		return 'object' === typeof text ? text.name : text;
	},

	isSelected: function( route ) {
		return this.props.route.path === route;
	},

	render: function() {
		let tabs = [], key = 0;

		forEach( this.props.navTabs, function( tab, index ) {
			tabs.push( (
				<NavItem
					key={ key }
					path={ tab.path }
					selected={ this.isSelected( tab.route ) }
				>
					{ tab.name }
				</NavItem>
			) );
			key++;
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
