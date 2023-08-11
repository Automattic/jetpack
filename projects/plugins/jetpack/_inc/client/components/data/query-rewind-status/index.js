import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import { fetchRewindStatus, isFetchingRewindStatus } from 'state/rewind';

class QueryRewindStatus extends Component {
	static propTypes = {
		isFetchingRewindStatus: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingRewindStatus: false,
		isOfflineMode: false,
	};

	UNSAFE_componentWillMount() {
		if ( ! this.props.isFetchingRewindStatus && ! this.props.isOfflineMode ) {
			this.props.fetchRewind();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingRewindStatus: isFetchingRewindStatus( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchRewind: () => dispatch( fetchRewindStatus() ),
		};
	}
)( QueryRewindStatus );
