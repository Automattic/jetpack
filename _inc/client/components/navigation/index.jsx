/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SectionNav from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';

/**
 * Internal dependencies
 */
import QueryModules from 'components/data/query-modules';
import { getModules } from 'state/modules';

const Navigation = React.createClass( {


	render: function() {
		return (
			<div className='dops-navigation'>
				<QueryModules />
				<SectionNav>
					<NavTabs label="Status">
						<NavItem path="#dashboard" selected={ this.props.route.path === '/dashboard' }>At a Glance</NavItem>
						<NavItem path="#engagement" selected={ this.props.route.path === '/engagement' }>Engagement</NavItem>
						<NavItem path="#security" selected={ this.props.route.path === '/security' }>Security</NavItem>
						<NavItem path="#health" selected={ this.props.route.path === '/health' }>Site Health</NavItem>
						<NavItem path="#more" selected={ this.props.route.path === '/more' }>More</NavItem>
						<NavItem path="#general" selected={ this.props.route.path === '/general' }>General</NavItem>
					</NavTabs>

					<Search
						pinned={ true }
						placeholder="Search Published..."
						analyticsGroup="Pages"
						delaySearch={ true }
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
