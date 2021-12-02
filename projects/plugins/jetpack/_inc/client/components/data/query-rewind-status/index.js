/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchRewindStatus, isFetchingRewindStatus } from 'state/rewind';
import { getSitePlan } from 'state/site';
import { isOfflineMode } from 'state/connection';

class QueryRewindStatus extends Component {
	static propTypes = {
		isFetchingRewindStatus: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
		sitePlan: PropTypes.object,
	};

	static defaultProps = {
		isFetchingRewindStatus: false,
		isOfflineMode: false,
		sitePlan: {},
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
			sitePlan: getSitePlan( state ),
		};
	},
	dispatch => {
		return {
			fetchRewind: () => dispatch( fetchRewindStatus() ),
		};
	}
)( QueryRewindStatus );
