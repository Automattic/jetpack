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
					<NavTabs label="Status" selectedText="At a Glance">
						<NavItem path="#dashboard" selected={ true }>At a Glance</NavItem>
						<NavItem path="#engagement" selected={ false }>Engagement</NavItem>
						<NavItem path="#security" selected={ false }>Security</NavItem>
						<NavItem path="#health" selected={ false }>Site Health</NavItem>
						<NavItem path="#more" selected={ false }>More</NavItem>
						<NavItem path="#general" selected={ false }>General</NavItem>
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
