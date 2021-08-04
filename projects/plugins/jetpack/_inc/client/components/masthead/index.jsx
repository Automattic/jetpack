/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { Masthead } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { HeaderNav } from './header-nav';
import {
	getSiteConnectionStatus,
	getSandboxDomain,
	fetchSiteConnectionTest,
} from 'state/connection';

export class JetpackMasthead extends React.Component {
	testConnection = () => {
		return this.props.testConnection();
	};

	render() {
		return (
			<Masthead
				sandboxDomain={ this.props.sandboxDomain }
				siteConnectionStatus={ this.props.siteConnectionStatus }
				testConnection={ this.props.testConnection }
			>
				<HeaderNav location={ this.props.location } />
			</Masthead>
		);
	}
}

export default connect(
	state => {
		return {
			sandboxDomain: getSandboxDomain( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
		};
	},
	dispatch => {
		return {
			testConnection: () => dispatch( fetchSiteConnectionTest() ),
		};
	}
)( JetpackMasthead );
