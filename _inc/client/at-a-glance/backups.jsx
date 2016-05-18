/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';

/**
 * Internal dependencies
 */
import QueryVaultPressData from 'components/data/query-vaultpress-data';
import {
	isModuleActivated as _isModuleActivated,
	activateModule,
	isFetchingModulesList as _isFetchingModulesList
} from 'state/modules';
import {
	getVaultPressData as _getVaultPressData
} from 'state/at-a-glance';

const DashBackups = React.createClass( {
	getContent: function() {
		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			const vpData = this.props.getVaultPressData();

			if ( vpData === 'N/A' ) {
				return(
					<DashItem label="Site Backups (VaultPress)">
						<p className="jp-dash-item__description">Loading&#8230;</p>
					</DashItem>
				);
			}

			const backupData = vpData.data.backups;

			if ( vpData.code === 'success' && backupData.has_full_backup ) {
				return(
					<DashItem label="Site Backups (VaultPress)" status="is-working">
						<h3>Your site is completely backed up!</h3>
						<p className="jp-dash-item__description">Full Backup Status: { backupData.full_backup_status } </p>
						<p className="jp-dash-item__description">Last Backup: { backupData.last_backup } </p>
					</DashItem>
				);
			}

			// All good
			if ( vpData.code === 'success' && backupData.full_backup_status !== '100% complete' ) {
				return(
					<DashItem label="Site Backups (VaultPress)" status="is-working">
						<h3>Currently backing up your site...</h3>
						<p className="jp-dash-item__description">Full Backup Status: { backupData.full_backup_status } </p>
						<p className="jp-dash-item__description">Last Backup: { backupData.last_backup }</p>
					</DashItem>
				);
			}
		}

		return(
			<DashItem label="Site Backups (VaultPress)" className="jp-dash-item__is-inactive" status="is-premium-inactive">
				<p className="jp-dash-item__description">To automatically back up your site, please <a href="#">upgrade your account (null)</a> or <a href="#">learn more (null)</a>.</p>
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
