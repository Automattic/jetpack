/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import i18n, { translate as __ } from 'lib/mixins/i18n';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

/**
 * Internal dependencies
 */
import QueryModules from 'components/data/query-modules';
import { getModules } from 'state/modules';

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
						<NavItem path="#dashboard" selected={ ( this.props.route.path === '/dashboard' ) || ( this.props.route.path === '/' ) }>At a Glance</NavItem>
						<NavItem path="#engagement" selected={ this.props.route.path === '/engagement' }>Engagement</NavItem>
						<NavItem path="#security" selected={ this.props.route.path === '/security' }>Security</NavItem>
						<NavItem path="#health" selected={ this.props.route.path === '/health' }>Site Health</NavItem>
						<NavItem path="#more" selected={ this.props.route.path === '/more' }>More</NavItem>
						<NavItem path="#general" selected={ this.props.route.path === '/general' }>General</NavItem>
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

export default connect( ( state ) => {
	return {
		modules: getModules( state )
	};
} )( Navigation );
