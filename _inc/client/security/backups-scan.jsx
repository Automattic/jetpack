/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import ExternalLink from 'components/external-link';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const BackupsScan = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'backups' } } support="https://vaultpress.com/jetpack/">
						<p>
							{
								__( 'Your site is backed up and threat-free.' )
							}
						</p>
						{
							! this.props.isUnavailableInDevMode( 'backups' ) && (
								<span>
									<ExternalLink className="jp-module-settings__external-link" href="https://dashboard.vaultpress.com/" >{ __( 'Configure your Security Scans' ) }</ExternalLink>
								</span>
							)
						}
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
