/**
 * External dependencies
 */
import { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { fetchVaultPressData } from 'state/at-a-glance';
import { isModuleActivated as _isModuleActivated } from 'state/modules';

class QueryVaultPressData extends Component {
	componentWillMount() {
		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			this.props.fetchVaultPressData()
		}
	}

	render() {
		return null;
	}
}

QueryVaultPressData.defaultProps = {
	fetchVaultPressData: () => {}
};

export default connect( ( state, ownProps ) => {
	return {
		fetchVaultPressData: fetchVaultPressData(),
		isModuleActivated: ( slug ) => _isModuleActivated( state, slug )
	};
}, ( dispatch ) => {
	return bindActionCreators( {
		fetchVaultPressData
	}, dispatch );
}
)( QueryVaultPressData );
