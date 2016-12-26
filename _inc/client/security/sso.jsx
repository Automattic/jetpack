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

export const SSO = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard header={ __( 'WordPress.com log in', { context: 'Settings header' } ) } { ...this.props } >
					<ModuleToggle slug={ 'subscriptions' }
								  compact
								  activated={ this.props.getOptionValue( 'subscriptions' ) }
								  toggling={ this.props.isSavingAnyOption() }
								  toggleModule={ this.toggleModule }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Allow log-in using WordPress.com accounts.' )
							}
						</span>
					</ModuleToggle>
					<p className="jp-form-setting-explanation">
						{
							__( 'Use WordPress.com’s secure authentication.' )
						}
					</p>
					<FormFieldset>
						<ModuleSettingCheckbox
							name={ 'jetpack_sso_match_by_email' }
							{ ...this.props }
							label={ __( 'Match By Email' ) } />
						<ModuleSettingCheckbox
							name={ 'jetpack_sso_require_two_step' }
							{ ...this.props }
							label={ __( 'Require Two-Step Authentication' ) } />
					</FormFieldset>
				</SettingsCard>
			);
		}
	} )
);
