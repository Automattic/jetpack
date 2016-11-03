/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { isFetchingMonitorData, fetchLastDownTime } from 'state/at-a-glance';
import { isModuleActivated as _isModuleActivated } from 'state/modules';

class QueryLastDownTime extends Component {
	componentWillMount() {
		if ( ! this.props.fetchingMonitorData && this.props.isModuleActivated( 'monitor' ) ) {
			this.props.fetchLastDownTime();
		}
	}

	render() {
		return null;
	}
}

QueryLastDownTime.defaultProps = {
	fetchLastDownTime: () => {}
};

export default connect( ( state ) => {
	return {
		fetchLastDownTime: fetchLastDownTime(),
		fetchingMonitorData: isFetchingMonitorData( state ),
		isModuleActivated: ( slug ) => _isModuleActivated( state, slug )
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchLastDownTime
	}, dispatch );
}
)( QueryLastDownTime );
