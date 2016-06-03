
/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	fetchPluginsData,
	isFetchingPluginsData,
	isPluginActive
} from 'state/site/plugins';

export const QuerySitePlugins = React.createClass( {
	componentDidMount() {
		this.props.fetchPluginsData();
	},

	render() {
		return null;
	}
} );

export default connect(
	( state ) => {
		return {
			isFetchingPluginsData: isFetchingPluginsData( state ),
			pluginsData: fetchPluginsData( state )
		};
	},
	( dispatch ) => {
		return {
			fetchPluginsData: () => dispatch( fetchPluginsData() )
		}
	}
)( QuerySitePlugins );
