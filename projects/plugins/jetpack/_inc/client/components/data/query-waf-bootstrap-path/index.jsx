/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { fetchWafBootstrapPath, isFetchingBootstrapPath } from 'state/firewall';
import { isOfflineMode } from 'state/connection';

class QueryBootstrapPath extends Component {
	static propTypes = {
		isFetchingBootstrapPath: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingBootstrapPath: false,
		isOfflineMode: false,
	};

	UNSAFE_componentWillMount() {
		if ( ! this.props.isFetchingBootstrapPath && ! this.props.isOfflineMode ) {
			this.props.fetchWafBootstrapPath();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingBootstrapPath: isFetchingBootstrapPath( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchWafBootstrapPath: () => dispatch( fetchWafBootstrapPath() ),
		};
	}
)( QueryBootstrapPath );
