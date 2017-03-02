/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { FEATURE_SECURITY_SCANNING_JETPACK } from 'lib/plans/constants';
import ExternalLink from 'components/external-link';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import ProStatus from 'pro-status';

export const BackupsScan = React.createClass( {
	toggleModule( name, value ) {
		this.props.updateFormStateOptionValue( name, ! value );
	},

	render() {
		return (
			<SettingsCard
				isSavingAnyOption={ this.props.isSavingAnyOption }
				feature={ FEATURE_SECURITY_SCANNING_JETPACK }
				header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
				hideButton
				notice={
					! this.props.isUnavailableInDevMode( 'backups' ) &&
						<ProStatus proFeature={ 'scan' } forceNotice={ true } />
				}>
				<SettingsGroup
					disableInDevMode
					module={ { module: 'backups' } }
					support="https://vaultpress.com/jetpack/">
					{
						! this.props.isUnavailableInDevMode( 'backups' ) && (
							<span>
								<ExternalLink
									className="jp-module-settings__external-link"
									href="https://dashboard.vaultpress.com/" >
									{ __( 'Configure your Security Scans' ) }
								</ExternalLink>
							</span>
						)
					}
				</SettingsGroup>
			</SettingsCard>
		);
	}
} );

export default moduleSettingsForm( BackupsScan );
