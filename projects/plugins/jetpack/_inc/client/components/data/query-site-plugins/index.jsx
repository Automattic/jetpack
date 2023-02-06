import React from 'react';
import { connect } from 'react-redux';
import { fetchPluginsData, isFetchingPluginsData } from 'state/site/plugins';

export class QuerySitePlugins extends React.Component {
	UNSAFE_componentWillMount() {
		if ( ! this.props.isFetchingPluginsData ) {
			this.props.fetchPluginsData();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingPluginsData: isFetchingPluginsData( state ),
		};
	},
	dispatch => {
		return {
			fetchPluginsData: () => dispatch( fetchPluginsData() ),
		};
	}
)( QuerySitePlugins );
