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
import { FormFieldset } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingCheckbox } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';

export const Antispam = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					header={ __( 'Antispam', { context: 'Settings header' } ) }
					support="https://akismet.com/jetpack/">
					<FormFieldset>
						<ModuleSettingCheckbox
							name={ 'akismet_show_user_comments_approved' }
							{ ...this.props }
							label={ __( 'Show the number of approved comments beside each comment author.' ) } />
					</FormFieldset>
				</SettingsCard>
			);
		}
	} )
);
