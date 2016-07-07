/**
 * External dependencies
 */
import React from 'react';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import forEach from 'lodash/forEach';
import find from 'lodash/find';
import { translate as __ } from 'i18n-calypso';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const Navigation = React.createClass( {
	getDefaultProps: function () {
		return {
			navTabs: [
				{
					name: __( 'At a Glance', { context: 'Navigation item.' } ),
					route: '/dashboard',
					path: '#dashboard'
				},
				{
					name: __( 'Apps', { context: 'Navigation item.' } ),
					route: '/apps',
					path: '#apps'
				},
				{
					name: __( 'Professional', { context: 'Navigation item.' } ),
					route: '/professional',
					path: '#professional'
				}
			]
		}
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
		let tabs = [];

		forEach( this.props.navTabs, function( tab ) {
			tabs.push( (
				<NavItem
					path={ tab.path }
					selected={ this.isSelected( tab.route ) }
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
				</SectionNav>
			</div>
		)
	}
} );

export default Navigation;
