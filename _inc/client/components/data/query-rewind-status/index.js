/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import {
	fetchRewindStatus,
	isFetchingRewindStatus
} from 'state/rewind';
import {
	getSitePlan
} from 'state/site';
import { isDevMode } from 'state/connection';

class QueryRewindStatus extends Component {
	static propTypes = {
		isFetchingRewindStatus: PropTypes.bool,
		isDevMode: PropTypes.bool,
		sitePlan: PropTypes.object
	};

	static defaultProps = {
		isFetchingRewindStatus: false,
		isDevMode: false,
		sitePlan: {}
	};

	componentWillMount() {
		if ( ! this.props.isFetchingRewindStatus && ! this.props.isDevMode ) {
			this.props.fetchRewind();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	( state ) => {
		return {
			isFetchingRewindStatus: isFetchingRewindStatus( state ),
			isDevMode: isDevMode( state ),
			sitePlan: getSitePlan( state )
		};
	},
	( dispatch ) => {
		return {
			fetchRewind: () => dispatch( fetchRewindStatus() )
		};
	}
)( QueryRewindStatus );
