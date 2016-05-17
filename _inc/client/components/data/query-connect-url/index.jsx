/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchConnectUrl } from 'state/connection';

class QueryConnectUrl extends Component {
	componentWillMount() {
		this.props.fetchConnectUrl();
	}

	render() {
		return null;
	}
}

QueryConnectUrl.defaultProps = {
	fetchConnectUrl: () => {}
};

export default connect( () => {
	return {
		fetchConnectUrl: fetchConnectUrl()
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchConnectUrl
	}, dispatch );
}
)( QueryConnectUrl );
