/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Tabs from 'components/tabs';
import Card from 'components/card';
import { replace } from 'react-router-redux';
import find from 'lodash/find';

/**
 * Internal dependencies
 */
import {Page as AtAGlance} from 'at-a-glance';
import {Page as Engagement} from 'engagement';
import {Page as Security} from 'security';
import GeneralSettings from 'general-settings/index.jsx';
import QueryModules from 'components/data/query-modules';
import { getModules } from 'state/modules';

const pathMap = [
	{ path: '/dashboard', index: 0 },
	{ path: '/engagement', index: 1 },
	{ path: '/security', index: 2 },
	{ path: '/health', index: 3 },
	{ path: '/more', index: 4 },
	{ path: '/general', index: 5 }
];

const Navigation = React.createClass( {
	handleTabClick: function( index ) {
		const path = find( pathMap, { index: index } );
		this.props.dispatch( replace( path.path ) );
	},

	render: function() {
		const tabIndex = find( pathMap, { path: this.props.route.path } ) || { index: 0 };

		return (
			<div className='dops-navigation'>
				<QueryModules />
				<Tabs activeTab={ tabIndex.index } onClick={ this.handleTabClick }>
					<Tabs.Panel title="At a Glance">
						<AtAGlance></AtAGlance>
					</Tabs.Panel>
					<Tabs.Panel title="Engagement">
						<Engagement></Engagement>
					</Tabs.Panel>
					<Tabs.Panel title="Security">
						<Security></Security>
					</Tabs.Panel>
					<Tabs.Panel title="Site Health">
						<Card className='dops-security-panel'>Site Health</Card>
					</Tabs.Panel>
					<Tabs.Panel title="More">
						<Card className='dops-security-panel'>More...</Card>
					</Tabs.Panel>
					<Tabs.Panel title="General Settings">
						<GeneralSettings { ...this.props } />
					</Tabs.Panel>
				</Tabs>
			</div>
		)
	}
} );

export default connect( ( state ) => {
	return {
		modules: getModules( state )
	};
} )( Navigation );
