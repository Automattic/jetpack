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
import { isModuleActivated as _isModuleActivated } from 'state/modules';

class QueryProtectCount extends Component {
	componentWillMount() {
		if ( this.props.isModuleActivated( 'protect' ) ) {
			this.props.fetchProtectCount()
		}
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
		fetchProtectCount: fetchProtectCount(),
		isModuleActivated: ( slug ) => _isModuleActivated( state, slug )
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchProtectCount
	}, dispatch );
}
)( QueryProtectCount );
