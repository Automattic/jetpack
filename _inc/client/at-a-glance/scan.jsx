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
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isActivatingModule,
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';
import { getVaultPressData as _getVaultPressData } from 'state/at-a-glance';

const DashScan = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'vaultpress' )  ) {
			const vpData = this.props.getVaultPressData();

			if ( vpData === 'N/A' ) {
				return(
					<DashItem label="Security Scan">
						Loading...
					</DashItem>
				);
			}

			// All good
			if ( vpData.code === 'success' ) {
				return(
					<DashItem label="Security Scan" status="is-working">
						Security Scan is working & all is good.
					</DashItem>
				);
			}

			const threats = ( vpData.data.security.notice_count !== '0' )
				? vpData.data.security.notice_count
				: 0;

			// Threats found!
			if ( threats !== 0 ) {
				return(
					<DashItem label="Security Scan" status="is-error">
						Uh oh, { threats } found! <a href="#">Do something.</a>
					</DashItem>
				);
			}
		}

		return(
			<DashItem label="Scan">
				Scan is not currently configured. <a href="#">Do something.</a>
			</DashItem>
		);
	},

	render: function() {
		return(
			<div>
				<QueryVaultPressData />
				{ this.getContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name ),
			isFetchingModulesList: () => _isFetchingModulesList( state ),
			getVaultPressData: () => _getVaultPressData( state )
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