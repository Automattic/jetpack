/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { isFetchingPluginUpdates, fetchPluginUpdates } from 'state/at-a-glance';

class QueryPluginUpdates extends Component {
	UNSAFE_componentWillMount() {
		if ( ! this.props.fetchingPluginUpdates ) {
			this.props.fetchPluginUpdates();
		}
	}

	render() {
		return null;
	}
}

QueryPluginUpdates.defaultProps = {
	fetchPluginUpdates: () => {},
};

export default connect(
	state => {
		return {
			fetchPluginUpdates: fetchPluginUpdates(),
			fetchingPluginUpdates: isFetchingPluginUpdates( state ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				fetchPluginUpdates,
			},
			dispatch
		);
	}
)( QueryPluginUpdates );
