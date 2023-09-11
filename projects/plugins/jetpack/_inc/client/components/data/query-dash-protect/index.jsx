import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { isFetchingProtectData, fetchProtectCount } from 'state/at-a-glance';
import { isModuleActivated as _isModuleActivated } from 'state/modules';

class QueryProtectCount extends Component {
	UNSAFE_componentWillMount() {
		if ( ! this.props.fetchingProtectData && this.props.isModuleActivated( 'protect' ) ) {
			this.props.fetchProtectCount();
		}
	}

	render() {
		return null;
	}
}

QueryProtectCount.defaultProps = {
	fetchProtectCount: () => {},
};

export default connect(
	state => {
		return {
			fetchProtectCount: fetchProtectCount(),
			fetchingProtectData: isFetchingProtectData( state ),
			isModuleActivated: slug => _isModuleActivated( state, slug ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				fetchProtectCount,
			},
			dispatch
		);
	}
)( QueryProtectCount );
