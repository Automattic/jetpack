/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { FEATURE_SECURITY_SCANNING_JETPACK } from 'lib/plans/constants';
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
					feature={ FEATURE_SECURITY_SCANNING_JETPACK }
					{ ...this.props }
					header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
					hideButton>
					<SettingsGroup disableInDevMode module={ { module: 'backups' } } support="https://vaultpress.com/jetpack/">
						{
							__( 'Your site is backed up and threat-free.' )
						}
					</SettingsGroup>
					{
						! this.props.isUnavailableInDevMode( 'backups' ) && (
							<Card compact className="jp-settings-card__configure-link" href="https://dashboard.vaultpress.com/">{ __( 'Configure your Security Scans' ) }</Card>
						)
					}
				</SettingsCard>
			);
		}
	} )
);
