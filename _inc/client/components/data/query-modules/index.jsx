/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchModules, isFetchingModulesList } from 'state/modules';

class QueryModules extends Component {
	UNSAFE_componentWillMount() {
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
