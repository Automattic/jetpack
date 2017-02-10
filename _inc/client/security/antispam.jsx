/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { FormFieldset } from 'components/forms';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingCheckbox } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const Antispam = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Antispam', { context: 'Settings header' } ) }>
					<SettingsGroup support="https://akismet.com/jetpack/">
						<FormFieldset>
							<ModuleSettingCheckbox
								name={ 'akismet_show_user_comments_approved' }
								{ ...this.props }
								label={ __( 'Show the number of approved comments beside each comment author' ) } />
						</FormFieldset>
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
