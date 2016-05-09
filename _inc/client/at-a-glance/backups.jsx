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
import {
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';

const DashBackups = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'vaultpress' )  ) {
			const vpData = this.props.getVaultPressData();

			if ( vpData === 'N/A' ) {
				return(
					<DashItem label="Site Backups">
						Loading...
					</DashItem>
				);
			}

			const backupData = vpData.data.backups;
			
			if ( vpData.code === 'success' && backupData.has_full_backup ) {
				return(
					<DashItem label="Site Backups" status="is-working">
						<h3>Your site is completely backed up!</h3>
						Full Backup Status: { backupData.full_backup_status } <br/>
						Last Backup: { backupData.last_backup }
					</DashItem>
				);
			}

			// All good
			if ( vpData.code === 'success' && backupData.full_backup_status !== '100% complete' ) {
				return(
					<DashItem label="Site Backups" status="is-working">
						<h3>Currently backing up your site...</h3>
						Full Backup Status: { backupData.full_backup_status } <br/>
						Last Backup: { backupData.last_backup }
					</DashItem>
				);
			}
		}

		return(
			<DashItem label="Scan">
				VaultPress is not activated. <a href="#">Fake link to do something</a>
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
)( DashBackups );