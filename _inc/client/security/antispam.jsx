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

export const Antispam = React.createClass( {
	toggleModule( name, value ) {
		this.props.updateFormStateOptionValue( name, ! value );
	},

	render() {
		return (
			<SettingsCard
				isSavingAnyOption={ this.props.isSavingAnyOption }
				isDirty={ this.props.isDirty }
				header={ __( 'Spam filtering', { context: 'Settings header' } ) }>
				<SettingsGroup
					support="https://akismet.com/jetpack/"
					module={ { module: 'protect' } }>
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
} );

export default moduleSettingsForm( Antispam );
