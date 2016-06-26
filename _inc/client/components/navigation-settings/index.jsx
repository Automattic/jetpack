/**
 * External dependencies
 */
import React from 'react';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import { translate as __ } from 'i18n-calypso';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

const NavigationSettings = React.createClass( {
	demoSearch: function( keywords ) {
		console.log( 'Section Nav Search (keywords):', keywords );
	},

	render: function() {
		return (
			<div className='dops-navigation'>
				<SectionNav>
					<NavTabs>
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
