/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import i18n, { translate as __ } from 'i18n-calypso';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

/**
 * Internal dependencies
 */
import QueryModules from 'components/data/query-modules';

const Navigation = React.createClass( {
	demoSearch: function( keywords ) {
		console.log( 'Section Nav Search (keywords):', keywords );
	},

	render: function() {
		return (
			<div className='dops-navigation'>
				<QueryModules />
				<SectionNav>
					<NavTabs>
						<NavItem
							path="#dashboard"
							selected={ ( this.props.route.path === '/dashboard' ) || ( this.props.route.path === '/' ) }>
							{ __( 'At a Glance', { context: 'Navigation item.' } ) }
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
							path="#health"
							selected={ this.props.route.path === '/health' }>Site
							{ __( 'Health', { context: 'Navigation item.' } ) }
						</NavItem>
						<NavItem
							path="#more"
							selected={ this.props.route.path === '/more' }>
							{ __( 'More', { context: 'Navigation item.' } ) }
						</NavItem>
						<NavItem
							path="#general"
							selected={ this.props.route.path === '/general' }>
							{ __( 'General', { context: 'Navigation item.' } ) }
						</NavItem>
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

export default Navigation;
