/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchUserConnectionData } from 'state/connection';

class QueryUserConnectionData extends Component {
	componentWillMount() {
		this.props.fetchUserConnectionData();
	}

	render() {
		return null;
	}
}

QueryUserConnectionData.defaultProps = {
	fetchSiteConnectionStatus: () => {}
};

export default connect( () => {
	return {
		fetchUserConnectionData: fetchUserConnectionData()
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchUserConnectionData
	}, dispatch );
}
)( QueryUserConnectionData );
