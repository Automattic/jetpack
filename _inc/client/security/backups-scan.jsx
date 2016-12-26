/**
 * External dependencies
 */
import analytics from 'lib/analytics';
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import TextInput from 'components/text-input';

/**
 * Internal dependencies
 */
import {
	FormFieldset,
	FormLabel
} from 'components/forms';
import ExternalLink from 'components/external-link';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';

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
					support="https://vaultpress.com/jetpack/"
					hideButton>
					<span>
						{
							__( 'Your site is backed up and threat-free.' )
						}
					</span>
					<p className="jp-form-setting-explanation">
						{
							__( 'You can see the information about your backups and security scanning in the "At a Glance" section.' )
						}
					</p>
					<p>
						<ExternalLink className="jp-module-settings__external-link" icon={ true } iconSize={ 16 } href="https://dashboard.vaultpress.com/" >{ __( 'Configure your Security Scans' ) }</ExternalLink>
					</p>
				</SettingsCard>
			);
		}
	} )
);
