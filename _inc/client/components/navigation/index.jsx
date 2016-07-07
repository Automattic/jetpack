/**
 * External dependencies
 */
import React from 'react';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import { translate as __ } from 'i18n-calypso';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const Navigation = React.createClass( {
	render: function() {
		let navTabs;
		if ( window.Initial_State.userData.currentUser.permissions.manage_modules ) {
			navTabs = (
				<NavTabs>
					<NavItem
						path="#dashboard"
						selected={ ( this.props.route.path === '/dashboard' ) || ( this.props.route.path === '/' ) }>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#apps"
						selected={ this.props.route.path === '/apps' }>
						{ __( 'Apps', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#professional"
						selected={ this.props.route.path === '/professional' }>
						{ __( 'Professional', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		} else {
			navTabs = (
				<NavTabs>
					<NavItem
						path="#dashboard"
						selected={ ( this.props.route.path === '/dashboard' ) || ( this.props.route.path === '/' ) }>
						{ __( 'At a Glance', { context: 'Navigation item.' } ) }
					</NavItem>
					<NavItem
						path="#apps"
						selected={ this.props.route.path === '/apps' }>
						{ __( 'Apps', { context: 'Navigation item.' } ) }
					</NavItem>
				</NavTabs>
			);
		}
		return (
			<div className='dops-navigation'>
				<SectionNav>
					{ navTabs }
				</SectionNav>
			</div>
		);
	}
} );

export default Navigation;