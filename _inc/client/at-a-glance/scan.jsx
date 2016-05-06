/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import DashSectionHeader from 'components/dash-section-header';

/**
 * Internal dependencies
 */
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule,
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';

const DashScan = React.createClass( {
	getContent: function() {
		if ( this.props.isFetchingModulesList( this.props ) ) {
			return(
				<DashItem label="Scan">
					Loading Data...
				</DashItem>
			);
		}

		if ( this.props.isModuleActivated( 'vaultpress' )  ) {
			return(
				<DashItem label="Scan" status="is-working">
					Yo, Scan is scanning
				</DashItem>
			);
		}

		return(
			<DashItem label="Scan">
				Scan is NOT ON!!!
			</DashItem>
		);
	},

	render: function() {
		return this.getContent();
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isFetchingModulesList: () => _isFetchingModulesList( state ),
			getModule: ( module_name ) => _getModule( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			activateModule: ( slug ) => {
				return dispatch( activateModule( slug ) );
			}
		};
	}
)( DashScan );