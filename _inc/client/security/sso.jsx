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
import {
	SettingsCard,
	SettingsGroup
} from 'components/settings-card';

export const SSO = moduleSettingsForm(
	React.createClass( {

		render() {
			let isSSOActive = this.props.getOptionValue( 'sso' );
			return (
				<SettingsCard
					{ ...this.props }
					module="sso"
					header={ __( 'WordPress.com log in', { context: 'Settings header' } ) }>
					<SettingsGroup hasChild support={ this.props.getModule( 'sso' ).learn_more_button }>
						<ModuleToggle slug="sso"
									  compact
									  activated={ isSSOActive }
									  toggling={ this.props.isSavingAnyOption( 'sso' ) }
									  toggleModule={ this.props.toggleModuleNow }>
						<span className="jp-form-toggle-explanation">
							{
								this.props.getModule( 'sso' ).description
							}
						</span>
						</ModuleToggle>
						{
							isSSOActive
								? <FormFieldset>
									<p className="jp-form-setting-explanation">
										{
											__( 'Use WordPress.com’s secure authentication.' )
										}
									</p>
									<ModuleSettingCheckbox
										name={ 'jetpack_sso_match_by_email' }
										{ ...this.props }
										label={ __( 'Match accounts using email addresses.' ) } />
									<ModuleSettingCheckbox
										name={ 'jetpack_sso_require_two_step' }
										{ ...this.props }
										label={ __( 'Require two step authentication.' ) } />
								  </FormFieldset>
								: ''
						}
					</SettingsGroup>
				</SettingsCard>
			);
		}
	} )
);
