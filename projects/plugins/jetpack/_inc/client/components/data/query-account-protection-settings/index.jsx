import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import {
	fetchAccountProtectionSettings,
	isFetchingAccountProtectionSettings,
} from 'state/account-protection';
import { isOfflineMode } from 'state/connection';

class QueryAccountProtectionSettings extends Component {
	static propTypes = {
		isFetchingAccountProtectionSettings: PropTypes.bool,
		isOfflineMode: PropTypes.bool,
	};

	static defaultProps = {
		isFetchingAccountProtectionSettings: false,
		isOfflineMode: false,
	};

	componentDidMount() {
		if ( ! this.props.isFetchingAccountProtectionSettings && ! this.props.isOfflineMode ) {
			this.props.fetchAccountProtectionSettings();
		}
	}

	render() {
		return null;
	}
}

export default connect(
	state => {
		return {
			isFetchingAccountProtectionSettings: isFetchingAccountProtectionSettings( state ),
			isOfflineMode: isOfflineMode( state ),
		};
	},
	dispatch => {
		return {
			fetchAccountProtectionSettings: () => dispatch( fetchAccountProtectionSettings() ),
		};
	}
)( QueryAccountProtectionSettings );
