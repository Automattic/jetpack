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
import { ModuleToggle } from 'components/module-toggle';
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import { ModuleSettingCheckbox } from 'components/module-settings/form-components';
import SettingsCard from 'components/settings-card';

export const Subscriptions = moduleSettingsForm(
	React.createClass( {

		toggleModule( name, value ) {
			this.props.updateFormStateOptionValue( name, !value );
		},

		render() {
			return (
				<SettingsCard header={ __( 'Subscriptions', { context: 'Settings header' } ) } { ...this.props } >
					<ModuleToggle slug={ 'subscriptions' }
								  compact
								  activated={ this.props.getOptionValue( 'subscriptions' ) }
								  toggling={ this.props.isSavingAnyOption() }
								  toggleModule={ this.toggleModule }>
						<span className="jp-form-toggle-explanation">
							{
								__( 'Allow users to subscribe to your posts and comments and receive notifications via email.' )
							}
						</span>
					</ModuleToggle>
					<p>
						{
							__( 'View your {{a}}Email Followers{{/a}}', {
								components: {
									a: <a href={ 'https://wordpress.com/people/email-followers/' + this.props.siteRawUrl } />
								}
							} )
						}
					</p>
					<FormFieldset>
						<ModuleSettingCheckbox
							name={ 'stb_enabled' }
							{ ...this.props }
							label={ __( 'Show a "follow blog" options in the comment form' ) } />
						<ModuleSettingCheckbox
							name={ 'stc_enabled' }
							{ ...this.props }
							label={ __( 'Show a "follow comments" option in the comment form.' ) } />
					</FormFieldset>
				</SettingsCard>
			);
		}
	} )
);
