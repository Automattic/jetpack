/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchScanStatus, isFetchingScanStatus } from 'state/scan';
import { isDevMode } from 'state/connection';

class QueryScanStatus extends Component {
	static propTypes = {
		isFetchingScanStatus: PropTypes.bool,
		isDevMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingScanStatus: false,
		isDevMode: false,
	};

	UNSAFE_componentWillMount() {
		if ( ! this.props.isFetchingScanStatus && ! this.props.isDevMode ) {
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
			isDevMode: isDevMode( state ),
		};
	},
	dispatch => {
		return {
			fetchScan: () => dispatch( fetchScanStatus() ),
		};
	}
)( QueryScanStatus );
