/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { isFetchingVaultPressData, fetchVaultPressData } from 'state/at-a-glance';
import { isModuleActivated as _isModuleActivated } from 'state/modules';

class QueryVaultPressData extends Component {
	UNSAFE_componentWillMount() {
		if ( ! this.props.fetchingVaultPressData && this.props.isModuleActivated( 'vaultpress' ) ) {
			this.props.fetchVaultPressData();
		}
	}

	render() {
		return null;
	}
}

QueryVaultPressData.defaultProps = {
	fetchVaultPressData: () => {},
};

export default connect(
	state => {
		return {
			fetchVaultPressData: fetchVaultPressData(),
			fetchingVaultPressData: isFetchingVaultPressData( state ),
			isModuleActivated: slug => _isModuleActivated( state, slug ),
		};
	},
	dispatch => {
		return bindActionCreators(
			{
				fetchVaultPressData,
			},
			dispatch
		);
	}
)( QueryVaultPressData );
