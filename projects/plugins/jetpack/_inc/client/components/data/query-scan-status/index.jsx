import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';
import { fetchScanStatus, isFetchingScanStatus } from 'state/scan';

class QueryScanStatus extends Component {
	static propTypes = {
		isFetchingScanStatus: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingScanStatus: false,
		isOfflineMode: false,
	};

	UNSAFE_componentWillMount() {
		if ( ! this.props.isFetchingScanStatus && ! this.props.isOfflineMode ) {
			this.props.fetchScan();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingScanStatus: isFetchingScanStatus( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchScan: () => dispatch( fetchScanStatus() ),
		};
	}
)( QueryScanStatus );
