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
import { isModuleActivated as _isModuleActivated } from 'state/modules';

class QueryLastDownTime extends Component {
	componentWillMount() {
		if ( this.props.isModuleActivated( 'monitor' ) ) {
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

export default connect( ( state, ownProps ) => {
	return {
		fetchLastDownTime: fetchLastDownTime(),
		isModuleActivated: ( slug ) => _isModuleActivated( state, slug )
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchLastDownTime
	}, dispatch );
}
)( QueryLastDownTime );
