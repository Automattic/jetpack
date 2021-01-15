/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchSiteConnectionStatus } from 'state/connection';

class QueryConnectionStatus extends Component {
	UNSAFE_componentWillMount() {
		this.props.fetchSiteConnectionStatus();
	}

	render() {
		return null;
	}
}

QueryConnectionStatus.defaultProps = {
	fetchSiteConnectionStatus: () => {},
};

export default connect(
	() => {
		return {
			fetchSiteConnectionStatus: fetchSiteConnectionStatus(),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				fetchSiteConnectionStatus,
			},
			dispatch
		);
	}
)( QueryConnectionStatus );
