/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchLastDownTime } from 'state/at-a-glance';

class QueryLastDownTime extends Component {
	componentWillMount() {
		this.props.fetchLastDownTime();
	}

	render() {
		return null;
	}
}

QueryLastDownTime.defaultProps = {
	fetchLastDownTime: () => {}
};

export default connect( ( state, ownProps ) => {
	return {
		fetchLastDownTime: fetchLastDownTime()
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchLastDownTime
	}, dispatch );
}
)( QueryLastDownTime );
