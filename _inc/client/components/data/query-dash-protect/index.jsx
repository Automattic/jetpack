/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchProtectCount } from 'state/at-a-glance';

class QueryProtectCount extends Component {
	componentWillMount() {
		this.props.fetchProtectCount();
	}

	render() {
		return null;
	}
}

QueryProtectCount.defaultProps = {
	fetchProtectCount: () => {}
};

export default connect( ( state, ownProps ) => {
	return {
		fetchProtectCount: fetchProtectCount()
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchProtectCount
	}, dispatch );
}
)( QueryProtectCount );
