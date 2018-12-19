/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchModules } from 'state/modules';
import { isFetchingModulesList } from 'state/modules';

class QueryModules extends Component {
	componentWillMount() {
		if ( ! this.props.fetchingModulesList ) {
			this.props.fetchModules();
		}
	}

	render() {
		return null;
	}
}

QueryModules.defaultProps = {
	fetchModules: () => {},
};

export default connect(
	state => {
		return {
			fetchingModulesList: isFetchingModulesList( state ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				fetchModules,
			},
			dispatch
		);
	}
)( QueryModules );
