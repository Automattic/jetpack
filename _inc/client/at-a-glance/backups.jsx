/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';

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
import { isDevMode } from 'state/connection';

const DashBackups = React.createClass( {
	getContent: function() {
		const labelName = __( 'Site Backups %(vaultpress)s', { args: { vaultpress: '(VaultPress)' } } );

		if ( this.props.isModuleActivated( 'vaultpress' ) ) {
			const vpData = this.props.getVaultPressData();

			if ( vpData === 'N/A' ) {
				return(
					<DashItem label={ labelName }>
						{ __( 'Loading…' ) }
					</DashItem>
				);
			}

			const backupData = vpData.data.backups;

			if ( vpData.code === 'success' && backupData.has_full_backup ) {
				return(
					<DashItem label={ labelName } status="is-working">
						<h3>{ __( 'Your site is completely backed up!' ) }</h3>
						<p className="jp-dash-item__description">{ __( 'Full Backup Status:' ) } { backupData.full_backup_status } </p>
						<p className="jp-dash-item__description">{ __( 'Last Backup:' ) } { backupData.last_backup } </p>
					</DashItem>
				);
			}

			// All good
			if ( vpData.code === 'success' && backupData.full_backup_status !== '100% complete' ) {
				return(
					<DashItem label={ labelName } status="is-working">
						<h3>{ __( 'Currently backing up your site.' ) }</h3>
						<p className="jp-dash-item__description">{ __( 'Full Backup Status:' ) } { backupData.full_backup_status } </p>
						<p className="jp-dash-item__description">{ __( 'Last Backup:' ) } { backupData.last_backup }</p>
					</DashItem>
				);
			}
		}

		return(
			<DashItem label={ labelName } className="jp-dash-item__is-inactive" status="is-premium-inactive">
				<p className="jp-dash-item__description">
					{
						isDevMode( this.props ) ? __( 'Unavailable in Dev Mode.' ) :
						__( 'To automatically back up your site, please {{a}}upgrade your account{{/a}}', {
							components: {
								a: <a href={ 'https://wordpress.com/plans/' + window.Initial_State.rawUrl } target="_blank" />
							}
						} )
					}
				</p>
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
